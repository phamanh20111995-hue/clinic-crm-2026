from datetime import timedelta, datetime
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Contract, Payment, Installment, ContractCredit

MANAGEMENT_ROLES = frozenset({'QUAN_LY', 'CHU_DN'})
PAYMENT_ROLES = {'KE_TOAN'} | MANAGEMENT_ROLES


def _num(v):
    try:
        return int(round(float(v or 0)))
    except (TypeError, ValueError):
        return 0


def _next_disbursement_date(start):
    """T+1, bo qua Thu 6 (4) / Thu 7 (5) / CN (6)."""
    d = start + timedelta(days=1)
    while d.weekday() in (4, 5, 6):
        d += timedelta(days=1)
    return d


class InstallmentOutSerializer(serializers.ModelSerializer):
    provider_type_display = serializers.CharField(source='get_provider_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    fee_bearer_display = serializers.CharField(source='get_fee_bearer_display', read_only=True)
    interest_bearer_display = serializers.CharField(source='get_interest_bearer_display', read_only=True)

    class Meta:
        model = Installment
        fields = [
            'id', 'provider', 'provider_type', 'provider_type_display',
            'principal', 'conversion_fee', 'fee_bearer', 'fee_bearer_display', 'fee_pk', 'fee_khach',
            'interest', 'interest_bearer', 'interest_bearer_display', 'interest_pk', 'interest_khach',
            'pk_net', 'pk_cost', 'status', 'status_display',
            'expected_date', 'actual_date', 'created_at',
        ]
        read_only_fields = fields


class PaymentOutSerializer(serializers.ModelSerializer):
    received_by_name = serializers.CharField(source='received_by.display_name', read_only=True)
    installments = InstallmentOutSerializer(many=True, read_only=True)
    contract_no = serializers.CharField(source='contract.contract_no', read_only=True)
    verify_status_display = serializers.CharField(source='get_verify_status_display', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.display_name', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'contract', 'contract_no', 'total',
            'cash_amount', 'transfer_amount', 'installment_amount',
            'received_at', 'received_by', 'received_by_name',
            'note', 'created_at', 'installments',
            'verify_status', 'verify_status_display', 'verified_by', 'verified_by_name', 'verified_at', 'verify_note',
        ]
        read_only_fields = fields


def _recompute_payment_status(contract):
    paid = sum(p.total for p in contract.payments.all())
    if paid <= 0:
        contract.payment_status = 'pending'
    elif paid >= contract.final_amount:
        contract.payment_status = 'received'
    else:
        contract.payment_status = 'partial'
    contract.save(update_fields=['payment_status'])


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def contract_payments(request, pk):
    """GET: lich su thu cua HD. POST: thu tien (TM + CK + tra gop)."""
    contract = Contract.objects.filter(pk=pk, is_deleted=False).first()
    if not contract:
        return Response({'detail': 'Khong tim thay hop dong.'}, status=404)

    if request.method == 'GET':
        qs = contract.payments.all().prefetch_related('installments')
        return Response(PaymentOutSerializer(qs, many=True).data)

    # POST -> thu tien
    role = getattr(request.user, 'role', None)
    if role not in (PAYMENT_ROLES | {'SALE'}):
        return Response({'detail': 'Ban khong co quyen thu tien.'}, status=403)
    if role == 'SALE' and contract.customer.sale_id != request.user.id:
        return Response({'detail': 'Sale chi thu tien cho KH do minh phu trach.'}, status=403)

    data = request.data or {}
    cash = _num(data.get('cash_amount'))
    transfer = _num(data.get('transfer_amount'))
    inst_amount = _num(data.get('installment_amount'))
    if cash < 0 or transfer < 0 or inst_amount < 0:
        return Response({'detail': 'So tien khong hop le.'}, status=400)
    total = cash + transfer + inst_amount
    if total <= 0:
        return Response({'detail': 'Tong tien thu phai lon hon 0.'}, status=400)

    received_at = data.get('received_at') or timezone.localdate().isoformat()
    try:
        r_date = datetime.strptime(received_at, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        r_date = timezone.localdate()

    inst_payload = data.get('installment') or None
    if inst_amount > 0 and not inst_payload:
        return Response({'detail': 'Thieu thong tin tra gop.'}, status=400)

    with transaction.atomic():
        payment = Payment.objects.create(
            contract=contract,
            total=total,
            cash_amount=cash,
            transfer_amount=transfer,
            installment_amount=inst_amount,
            received_at=r_date,
            received_by=request.user,
            note=data.get('note', ''),
            verify_status=('da_xac_nhan' if role in PAYMENT_ROLES else 'cho_xac_nhan'),
            verified_by=(request.user if role in PAYMENT_ROLES else None),
            verified_at=(timezone.now() if role in PAYMENT_ROLES else None),
        )

        if inst_amount > 0:
            provider_type = inst_payload.get('provider_type', 'vay_tieu_dung')
            principal = _num(inst_payload.get('principal')) or inst_amount
            conversion_fee = _num(inst_payload.get('conversion_fee'))
            interest = _num(inst_payload.get('interest'))
            fee_bearer = inst_payload.get('fee_bearer', 'khach')
            interest_bearer = inst_payload.get('interest_bearer', 'khach')

            # Tach phi chuyen doi theo ben chiu
            if fee_bearer == 'pk':
                fee_pk, fee_khach = conversion_fee, 0
            elif fee_bearer == 'khach':
                fee_pk, fee_khach = 0, conversion_fee
            else:  # chia
                fee_pk = _num(inst_payload.get('fee_pk'))
                fee_khach = _num(inst_payload.get('fee_khach'))

            # Tach lai theo ben chiu (PK chiu lai = hoan lai cho khach)
            if interest_bearer == 'pk':
                interest_pk, interest_khach = interest, 0
            elif interest_bearer == 'khach':
                interest_pk, interest_khach = 0, interest
            else:  # chia
                interest_pk = _num(inst_payload.get('interest_pk'))
                interest_khach = _num(inst_payload.get('interest_khach'))

            pk_cost = fee_pk + interest_pk
            pk_net = principal - pk_cost

            if provider_type == 'the_tin_dung':
                inst_status = 'da_ve'
                expected_date = r_date
                actual_date = r_date
            else:  # vay_tieu_dung -> cho giai ngan
                inst_status = 'cho_giai_ngan'
                expected_date = _next_disbursement_date(r_date)
                actual_date = None

            Installment.objects.create(
                payment=payment,
                provider=inst_payload.get('provider', ''),
                provider_type=provider_type,
                principal=principal,
                conversion_fee=conversion_fee,
                fee_bearer=fee_bearer,
                fee_pk=fee_pk,
                fee_khach=fee_khach,
                interest=interest,
                interest_bearer=interest_bearer,
                interest_pk=interest_pk,
                interest_khach=interest_khach,
                pk_net=pk_net,
                pk_cost=pk_cost,
                status=inst_status,
                expected_date=expected_date,
                actual_date=actual_date,
            )

        _recompute_payment_status(contract)

    return Response(PaymentOutSerializer(payment).data, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cong_no_list(request):
    """Danh sach HD da duyet con du no (final_amount - tong da thu > 0)."""
    qs = (Contract.objects
          .filter(is_deleted=False, approval_status='approved').filter(**({'customer__sale_id': request.user.id} if getattr(request.user, 'role', None) == 'SALE' else {}))
          .select_related('customer')
          .prefetch_related('payments'))
    data = []
    for c in qs:
        paid = sum(p.total for p in c.payments.all())
        remaining = int(c.final_amount) - int(paid)
        if remaining <= 0:
            continue
        data.append({
            'contract_id': c.id,
            'contract_no': c.contract_no,
            'customer_name': c.customer.full_name,
            'customer_phone': c.customer.phone,
            'final_amount': int(c.final_amount),
            'paid': int(paid),
            'remaining': remaining,
            'created_at': c.created_at,
        })
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def installment_list(request):
    """Theo doi khoan tra gop. Loc ?status= & ?provider_type="""
    qs = (Installment.objects
          .select_related('payment', 'payment__contract', 'payment__contract__customer')
          .all())
    status_f = request.query_params.get('status')
    if status_f:
        qs = qs.filter(status=status_f)
    provider_type = request.query_params.get('provider_type')
    if provider_type:
        qs = qs.filter(provider_type=provider_type)
    data = []
    for inst in qs:
        row = InstallmentOutSerializer(inst).data
        c = inst.payment.contract
        row['contract_id'] = c.id
        row['contract_no'] = c.contract_no
        row['customer_name'] = c.customer.full_name
        data.append(row)
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_installment(request, pk):
    """Xac nhan 1 khoan tra gop da ve ket."""
    if getattr(request.user, 'role', None) not in PAYMENT_ROLES:
        return Response({'detail': 'Ban khong co quyen xac nhan.'}, status=403)
    inst = Installment.objects.filter(pk=pk).first()
    if not inst:
        return Response({'detail': 'Khong tim thay khoan tra gop.'}, status=404)
    actual = request.data.get('actual_date') or timezone.localdate().isoformat()
    inst.status = 'da_ve'
    inst.actual_date = actual
    inst.save(update_fields=['status', 'actual_date'])
    return Response(InstallmentOutSerializer(inst).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_installments_batch(request):
    """Xac nhan ve ket theo lo. Body: {"ids": [...], "actual_date": "YYYY-MM-DD"}"""
    if getattr(request.user, 'role', None) not in PAYMENT_ROLES:
        return Response({'detail': 'Ban khong co quyen xac nhan.'}, status=403)
    ids = request.data.get('ids') or []
    if not isinstance(ids, list) or not ids:
        return Response({'detail': 'Thieu danh sach id.'}, status=400)
    actual = request.data.get('actual_date') or timezone.localdate().isoformat()
    updated = Installment.objects.filter(pk__in=ids).update(status='da_ve', actual_date=actual)
    return Response({'updated': updated})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payments_pending(request):
    """Hop thu doi soat: cac lan thu dang cho xac nhan (KT/QL)."""
    if getattr(request.user, 'role', None) not in PAYMENT_ROLES:
        return Response({'detail': 'Khong co quyen.'}, status=403)
    qs = (Payment.objects.filter(verify_status__in=['cho_xac_nhan', 'lech'])
          .select_related('contract', 'contract__customer', 'received_by')
          .prefetch_related('installments'))
    data = []
    for p in qs:
        row = PaymentOutSerializer(p).data
        row['customer_name'] = p.contract.customer.full_name
        row['final_amount'] = int(p.contract.final_amount)
        data.append(row)
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_payment(request, pk):
    """QL/KT xac nhan hoac bao lech mot lan thu. Body: {action:'confirm'|'flag', note}."""
    if getattr(request.user, 'role', None) not in PAYMENT_ROLES:
        return Response({'detail': 'Ban khong co quyen doi soat.'}, status=403)
    payment = Payment.objects.filter(pk=pk).first()
    if not payment:
        return Response({'detail': 'Khong tim thay lan thu.'}, status=404)
    action = (request.data or {}).get('action')
    if action == 'confirm':
        payment.verify_status = 'da_xac_nhan'
    elif action == 'flag':
        payment.verify_status = 'lech'
    else:
        return Response({'detail': "action phai la 'confirm' hoac 'flag'."}, status=400)
    payment.verified_by = request.user
    payment.verified_at = timezone.now()
    payment.verify_note = (request.data or {}).get('note', '')
    payment.save(update_fields=['verify_status', 'verified_by', 'verified_at', 'verify_note'])
    return Response(PaymentOutSerializer(payment).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payments_mine(request):
    """Cac lan thu do chinh minh ghi (received_by = user). Loc ?verify_status="""
    qs = (Payment.objects.filter(received_by=request.user)
          .select_related('contract', 'contract__customer')
          .prefetch_related('installments')
          .order_by('-received_at', '-created_at'))
    vs = request.query_params.get('verify_status')
    if vs:
        qs = qs.filter(verify_status=vs)
    data = []
    for p in qs:
        row = PaymentOutSerializer(p).data
        row['customer_name'] = p.contract.customer.full_name
        row['final_amount'] = int(p.contract.final_amount)
        data.append(row)
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def edit_payment(request, pk):
    """Nguoi ghi sua lai lan thu (TM/CK) khi bi bao lech -> reset ve 'cho_xac_nhan'.
    V1: khong sua duoc lan thu co tra gop (de KT xu ly tay)."""
    payment = Payment.objects.filter(pk=pk).first()
    if not payment:
        return Response({'detail': 'Khong tim thay lan thu.'}, status=404)
    role = getattr(request.user, 'role', None)
    is_owner = payment.received_by_id == request.user.id
    if not (is_owner or role in PAYMENT_ROLES):
        return Response({'detail': 'Chi nguoi ghi (hoac KT/QL) moi sua duoc.'}, status=403)
    if payment.verify_status not in ('cho_xac_nhan', 'lech'):
        return Response({'detail': 'Chi sua duoc lan thu dang cho xac nhan hoac bi bao lech.'}, status=400)
    if payment.installments.exists():
        return Response({'detail': 'Lan thu co tra gop, can Ke toan xu ly.'}, status=400)

    data = request.data or {}
    cash = _num(data.get('cash_amount'))
    transfer = _num(data.get('transfer_amount'))
    if cash < 0 or transfer < 0:
        return Response({'detail': 'So tien khong hop le.'}, status=400)
    total = cash + transfer
    if total <= 0:
        return Response({'detail': 'Tong tien thu phai lon hon 0.'}, status=400)

    received_at = data.get('received_at')
    if received_at:
        try:
            payment.received_at = datetime.strptime(received_at, '%Y-%m-%d').date()
        except (ValueError, TypeError):
            pass

    payment.cash_amount = cash
    payment.transfer_amount = transfer
    payment.installment_amount = 0
    payment.total = total
    if 'note' in data:
        payment.note = data.get('note', '')
    # reset ve cho xac nhan (Sale sua xong -> KT xac nhan lai)
    payment.verify_status = 'cho_xac_nhan'
    payment.verified_by = None
    payment.verified_at = None
    payment.verify_note = ''
    payment.save()

    _recompute_payment_status(payment.contract)
    return Response(PaymentOutSerializer(payment).data)


REGION_LABELS = {'mien_bac': 'Miền Bắc', 'mien_trung': 'Miền Trung', 'mien_nam': 'Miền Nam'}


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def doanh_thu_chi_tiet(request):
    """Thong ke doanh thu chi tiet theo nguoi/vai tro/co so/mien (neo theo thuc thu).
    Query: from, to (loc Payment.received_at), role, user_id, clinic_id, region, group_by (user|role|clinic|region)."""
    if getattr(request.user, 'role', None) not in PAYMENT_ROLES:
        return Response({'detail': 'Khong co quyen.'}, status=403)

    p = request.query_params
    d_from, d_to = p.get('from'), p.get('to')
    group_by = p.get('group_by') or 'user'
    if group_by not in ('user', 'role', 'clinic', 'region'):
        group_by = 'user'

    credits = (ContractCredit.objects
               .select_related('contract', 'contract__customer', 'user', 'clinic')
               .filter(contract__is_deleted=False, contract__approval_status='approved'))
    if p.get('role'):
        credits = credits.filter(role=p['role'])
    if p.get('user_id'):
        credits = credits.filter(user_id=p['user_id'])
    if p.get('clinic_id'):
        credits = credits.filter(clinic_id=p['clinic_id'])
    if p.get('region'):
        credits = credits.filter(region=p['region'])
    credits = list(credits)

    contract_ids = {c.contract_id for c in credits}
    pay_qs = Payment.objects.filter(contract_id__in=contract_ids)
    if d_from:
        pay_qs = pay_qs.filter(received_at__gte=d_from)
    if d_to:
        pay_qs = pay_qs.filter(received_at__lte=d_to)
    thuthu_map = {r['contract_id']: int(r['s'] or 0)
                  for r in pay_qs.values('contract_id').annotate(s=Sum('total'))}

    rows, summary = [], {}
    for c in credits:
        tt = thuthu_map.get(c.contract_id, 0)
        if (d_from or d_to) and tt == 0:
            continue  # loc theo ky: bo HD khong co tien ve trong ky
        ct = c.contract
        region_lbl = REGION_LABELS.get(c.region, c.region) if c.region else ''
        rows.append({
            'contract_id': c.contract_id,
            'contract_no': ct.contract_no,
            'customer_name': ct.customer.full_name,
            'user_id': c.user_id,
            'user_name': c.user.display_name if c.user else '',
            'role': c.role,
            'role_display': c.get_role_display(),
            'clinic_name': c.clinic.name if c.clinic_id else '',
            'region': region_lbl,
            'final_amount': int(ct.final_amount),
            'thuc_thu': tt,
        })
        if group_by == 'user':
            key, label = c.user_id, (c.user.display_name if c.user else '—')
        elif group_by == 'role':
            key, label = c.role, c.get_role_display()
        elif group_by == 'clinic':
            key, label = (c.clinic_id or 0), (c.clinic.name if c.clinic_id else '(Chưa gán cơ sở)')
        else:
            key, label = (c.region or ''), (region_lbl or '(Chưa gán miền)')
        g = summary.setdefault(key, {'key': key, 'label': label, 'so_hd': 0, 'thuc_thu': 0})
        g['so_hd'] += 1
        g['thuc_thu'] += tt

    summary_list = sorted(summary.values(), key=lambda x: x['thuc_thu'], reverse=True)
    return Response({'rows': rows, 'summary': summary_list, 'group_by': group_by})
