from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Deposit, Contract

MANAGEMENT_ROLES = frozenset({'QUAN_LY', 'CHU_DN'})
PAY_ROLES = {'KE_TOAN'} | MANAGEMENT_ROLES


def _num(v):
    try:
        return int(round(float(v or 0)))
    except (TypeError, ValueError):
        return 0


def _parse_date(s):
    if not s:
        return None
    try:
        return timezone.datetime.strptime(s, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return None


def _next_code():
    last = Deposit.objects.order_by('-id').first()
    n = (last.id + 1) if last else 1
    return f'DC-{n:04d}'


def _contract_con_no(c):
    paid = sum(int(p.total) for p in c.payments.all())
    dep = sum(int(d.amount) for d in c.applied_deposits.filter(status='da_dung', is_deleted=False))
    return int(c.final_amount) - paid - dep


def _deposit_row(d, user=None):
    return {
        'id': d.id,
        'code': d.code,
        'customer_id': d.customer_id,
        'customer_name': d.customer.full_name if d.customer_id else '',
        'customer_phone': getattr(d.customer, 'phone', '') if d.customer_id else '',
        'amount': int(d.amount),
        'cash_amount': int(d.cash_amount),
        'transfer_amount': int(d.transfer_amount),
        'method': d.method,
        'method_label': d.get_method_display(),
        'reason': d.reason,
        'status': d.status,
        'status_label': d.get_status_display(),
        'verify_status': d.verify_status,
        'verify_status_label': d.get_verify_status_display(),
        'verify_note': d.verify_note,
        'verified_by_name': d.verified_by.display_name if d.verified_by_id else '',
        'nguoi_nhan_id': d.nguoi_nhan_id,
        'nguoi_nhan_name': d.nguoi_nhan.display_name if d.nguoi_nhan_id else '',
        'so_phieu': d.so_phieu,
        'received_by_name': d.received_by.display_name if d.received_by_id else '',
        'received_at': d.received_at.isoformat() if d.received_at else None,
        'applied_contract_id': d.applied_contract_id,
        'applied_contract_no': d.applied_contract.contract_no if d.applied_contract_id else '',
        'settled_at': d.settled_at.isoformat() if d.settled_at else None,
        'settled_by_name': d.settled_by.display_name if d.settled_by_id else '',
        'settle_method': d.settle_method,
        'settle_note': d.settle_note,
        'created_at': d.created_at.isoformat(),
        'can_i_verify': bool(user and d.verify_status in ('cho_xac_nhan', 'lech') and getattr(user, 'role', None) in PAY_ROLES and user.id != d.received_by_id),
    }


def _split_amounts(data):
    """Chuan hoa (amount, cash, transfer, method) tu input. Ho tro combined TM+CK."""
    method = data.get('method', 'cash')
    if method == 'combined':
        cash = _num(data.get('cash_amount'))
        trans = _num(data.get('transfer_amount'))
        return cash + trans, cash, trans, 'combined'
    amt = _num(data.get('amount'))
    if method == 'transfer':
        return amt, 0, amt, 'transfer'
    return amt, amt, 0, 'cash'


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def deposit_list_create(request):
    """GET: danh sach coc (filter status, customer_id). POST: tao phieu coc (bat ky nhan su)."""
    if request.method == 'POST':
        d = request.data or {}
        amount, cash, trans, method = _split_amounts(d)
        if amount <= 0:
            return Response({'detail': 'So tien coc phai lon hon 0.'}, status=400)
        if not d.get('customer'):
            return Response({'detail': 'Thieu khach hang.'}, status=400)
        dep = Deposit.objects.create(
            code=_next_code(),
            customer_id=d.get('customer'),
            clinic_id=d.get('clinic_id') or None,
            amount=amount,
            cash_amount=cash,
            transfer_amount=trans,
            method=method,
            reason=d.get('reason', ''),
            status='giu',
            verify_status='cho_xac_nhan',
            received_by=request.user,
            received_at=_parse_date(d.get('received_at')) or timezone.localdate(),
            nguoi_nhan_id=d.get('nguoi_nhan') or request.user.id,
            so_phieu=d.get('so_phieu', ''),
        )
        return Response(_deposit_row(dep, request.user), status=201)

    qs = Deposit.objects.select_related('customer', 'received_by', 'verified_by', 'nguoi_nhan', 'applied_contract', 'settled_by').prefetch_related('applied_contract__applied_deposits').filter(is_deleted=False)
    status = request.query_params.get('status')
    verify_status = request.query_params.get('verify_status')
    customer_id = request.query_params.get('customer_id')
    if status:
        qs = qs.filter(status=status)
    if verify_status:
        qs = qs.filter(verify_status=verify_status)
    if customer_id:
        qs = qs.filter(customer_id=customer_id)
    return Response([_deposit_row(d, request.user) for d in qs[:500]])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def deposit_customer_contracts(request):
    """HD cua 1 khach (da duyet, con no) de tru coc vao — gom ca DV/SP khach doi sang."""
    customer_id = request.query_params.get('customer_id')
    if not customer_id:
        return Response([])
    qs = Contract.objects.prefetch_related('payments', 'applied_deposits').filter(customer_id=customer_id, is_deleted=False, approval_status='approved')
    rows = []
    for c in qs:
        rows.append({
            'id': c.id, 'contract_no': c.contract_no,
            'final_amount': int(c.final_amount),
            'con_no': _contract_con_no(c),
        })
    return Response(rows)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def deposit_apply(request, pk):
    """Tru coc vao 1 HD (dich vu ban dau HOAC SP/DV khach doi sang). Body {contract_id}."""
    if getattr(request.user, 'role', None) not in PAY_ROLES:
        return Response({'detail': 'Khong co quyen.'}, status=403)
    dep = Deposit.objects.filter(pk=pk, is_deleted=False).first()
    if not dep:
        return Response({'detail': 'Khong tim thay coc.'}, status=404)
    if dep.verify_status != 'da_xac_nhan':
        return Response({'detail': 'Coc chua duoc KT xac nhan thu.'}, status=400)
    if dep.status != 'giu':
        return Response({'detail': 'Coc khong con o trang thai dang giu.'}, status=400)
    contract_id = request.data.get('contract_id')
    c = Contract.objects.filter(pk=contract_id, is_deleted=False).first()
    if not c:
        return Response({'detail': 'Khong tim thay HD.'}, status=404)
    if c.customer_id != dep.customer_id:
        return Response({'detail': 'HD khong thuoc khach cua coc nay.'}, status=400)
    dep.status = 'da_dung'
    dep.applied_contract = c
    dep.settled_at = timezone.localdate()
    dep.settled_by = request.user
    dep.save(update_fields=['status', 'applied_contract', 'settled_at', 'settled_by'])
    return Response(_deposit_row(dep, request.user))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def deposit_settle(request, pk):
    """Tat toan coc: action=hoan (tra khach) hoac mat (PK giu -> thu nhap khac). Body {action, settle_method, note}."""
    if getattr(request.user, 'role', None) not in PAY_ROLES:
        return Response({'detail': 'Khong co quyen.'}, status=403)
    dep = Deposit.objects.filter(pk=pk, is_deleted=False).first()
    if not dep:
        return Response({'detail': 'Khong tim thay coc.'}, status=404)
    if dep.verify_status != 'da_xac_nhan':
        return Response({'detail': 'Coc chua duoc KT xac nhan thu.'}, status=400)
    if dep.status != 'giu':
        return Response({'detail': 'Coc khong con o trang thai dang giu.'}, status=400)
    action = request.data.get('action')
    if action not in ('hoan', 'mat'):
        return Response({'detail': 'Action phai la hoan hoac mat.'}, status=400)
    dep.status = action
    dep.settled_at = timezone.localdate()
    dep.settled_by = request.user
    dep.settle_note = request.data.get('note', '')
    if action == 'hoan':
        dep.settle_method = request.data.get('settle_method') or dep.method
    dep.save(update_fields=['status', 'settled_at', 'settled_by', 'settle_note', 'settle_method'])
    return Response(_deposit_row(dep, request.user))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def deposit_delete(request, pk):
    """Xoa mem phieu coc (chi khi dang giu). Nguoi tao hoac quan ly."""
    dep = Deposit.objects.filter(pk=pk, is_deleted=False).first()
    if not dep:
        return Response({'detail': 'Khong tim thay.'}, status=404)
    is_owner = (dep.received_by_id == request.user.id) or getattr(request.user, 'role', None) in MANAGEMENT_ROLES
    if not is_owner:
        return Response({'detail': 'Khong co quyen xoa.'}, status=403)
    if dep.status != 'giu':
        return Response({'detail': 'Coc da tat toan, khong xoa duoc.'}, status=400)
    dep.is_deleted = True
    dep.save(update_fields=['is_deleted'])
    return Response({'ok': True})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def deposit_verify(request, pk):
    """KT xac nhan thu coc hoac bao lech (maker-checker). Body {action: xac_nhan|lech, note}."""
    if getattr(request.user, 'role', None) not in PAY_ROLES:
        return Response({'detail': 'Khong co quyen xac nhan.'}, status=403)
    dep = Deposit.objects.filter(pk=pk, is_deleted=False).first()
    if not dep:
        return Response({'detail': 'Khong tim thay coc.'}, status=404)
    if dep.verify_status not in ('cho_xac_nhan', 'lech'):
        return Response({'detail': 'Coc khong o trang thai cho xac nhan.'}, status=400)
    # Chong tu duyet: nguoi xac nhan != nguoi nhap phieu (tach vai chong that thoat)
    if request.user.id == dep.received_by_id:
        return Response({'detail': 'Khong the tu xac nhan phieu minh nhap. Can nguoi khac (QL/Chu DN/KT khac) xac nhan.'}, status=403)
    action = request.data.get('action')
    if action == 'xac_nhan':
        dep.verify_status = 'da_xac_nhan'
        dep.verify_note = ''
    elif action == 'lech':
        dep.verify_status = 'lech'
        dep.verify_note = request.data.get('note', '')
    else:
        return Response({'detail': 'Action phai la xac_nhan hoac lech.'}, status=400)
    dep.verified_by = request.user
    dep.verified_at = timezone.now()
    dep.save(update_fields=['verify_status', 'verify_note', 'verified_by', 'verified_at'])
    return Response(_deposit_row(dep, request.user))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def deposit_edit(request, pk):
    """Nguoi ghi sua lai phieu coc khi bi bao lech (hoac con cho xac nhan) -> ve 'cho xac nhan'."""
    dep = Deposit.objects.filter(pk=pk, is_deleted=False).first()
    if not dep:
        return Response({'detail': 'Khong tim thay coc.'}, status=404)
    if dep.verify_status not in ('cho_xac_nhan', 'lech') or dep.status != 'giu':
        return Response({'detail': 'Chi sua duoc phieu coc dang cho xac nhan / bi lech.'}, status=400)
    is_owner = request.user.id in (dep.received_by_id, dep.nguoi_nhan_id) or getattr(request.user, 'role', None) in (MANAGEMENT_ROLES | {'KE_TOAN'})
    if not is_owner:
        return Response({'detail': 'Chi nguoi ghi (hoac KT/QL) duoc sua.'}, status=403)
    d = request.data or {}
    if 'amount' in d or 'cash_amount' in d or 'transfer_amount' in d:
        amount, cash, trans, method = _split_amounts({**d, 'method': d.get('method', dep.method)})
        if amount <= 0:
            return Response({'detail': 'So tien coc phai lon hon 0.'}, status=400)
        dep.amount = amount
        dep.cash_amount = cash
        dep.transfer_amount = trans
        dep.method = method
    elif 'method' in d:
        dep.method = d.get('method')
    dep.reason = d.get('reason', dep.reason)
    dep.so_phieu = d.get('so_phieu', dep.so_phieu)
    if d.get('nguoi_nhan'):
        dep.nguoi_nhan_id = d.get('nguoi_nhan')
    if d.get('received_at'):
        dep.received_at = _parse_date(d.get('received_at')) or dep.received_at
    dep.verify_status = 'cho_xac_nhan'
    dep.verify_note = ''
    dep.save()
    return Response(_deposit_row(dep, request.user))
