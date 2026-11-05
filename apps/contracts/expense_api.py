from django.db import transaction
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

import calendar
from .models import (
    ExpenseRequest, ExpenseApproval, ExpensePayout, Payment,
    CashReconciliation, CashDeposit,
    build_expense_chain, EXPENSE_OWNER_THRESHOLD,
)

MANAGEMENT_ROLES = frozenset({'QUAN_LY', 'CHU_DN'})
PAY_ROLES = {'KE_TOAN'} | MANAGEMENT_ROLES  # ai duoc ghi "da chi"


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
    last = ExpenseRequest.objects.order_by('-id').first()
    n = (last.id + 1) if last else 1
    return f'DXC-{n:04d}'


def _add_months(d, months):
    """Cong them 'months' thang, giu ngay (bu neu thang ngan)."""
    y = d.year + (d.month - 1 + months) // 12
    m = (d.month - 1 + months) % 12 + 1
    day = min(d.day, calendar.monthrange(y, m)[1])
    return d.replace(year=y, month=m, day=day)


def generate_expense_payouts(e):
    """Sinh lich tra gop cho de xuat mua tra gop: chia deu, ky cuoi bu le, moi ky cach 1 thang tu ky_dau."""
    if not e.is_installment:
        return
    n = e.so_ky or 0
    if n <= 0 or e.payouts.exists():
        return
    total = int(e.amount)
    base = total // n
    start = e.ky_dau or timezone.localdate()
    objs = [
        ExpensePayout(
            request=e, ky_no=i,
            due_date=_add_months(start, i - 1),
            amount=(base if i < n else total - base * (n - 1)),
            method='transfer',
        )
        for i in range(1, n + 1)
    ]
    ExpensePayout.objects.bulk_create(objs)


def _can_act(user, step):
    """User duoc ky buoc 'step' khong: dung role, hoac Chu DN (override toan quyen)."""
    if step is None:
        return False
    role = getattr(user, 'role', None)
    return role == step.role or role == 'CHU_DN'


def _approval_rows(e):
    return [{
        'step_order': a.step_order,
        'role': a.role,
        'label': a.label,
        'status': a.status,
        'status_label': a.get_status_display(),
        'approver_name': a.approver.display_name if a.approver_id else '',
        'acted_at': a.acted_at.isoformat() if a.acted_at else None,
        'note': a.note,
    } for a in e.approvals.all()]


def _expense_row(e, user=None):
    cur = e.current_step
    return {
        'id': e.id,
        'code': e.code,
        'clinic_id': e.clinic_id,
        'clinic_name': e.clinic.name if e.clinic_id else '(Chung)',
        'category': e.category,
        'category_label': e.get_category_display(),
        'title': e.title,
        'reason': e.reason,
        'amount': int(e.amount),
        'payment_method': e.payment_method,
        'payment_method_label': e.get_payment_method_display(),
        'co_hoa_don_vat': e.co_hoa_don_vat,
        'chung_tu': e.chung_tu or [],
        'chung_tu_note': e.chung_tu_note,
        'status': e.status,
        'status_label': e.get_status_display(),
        'requested_by_name': e.requested_by.display_name if e.requested_by_id else '',
        'created_at': e.created_at.isoformat(),
        'paid_at': e.paid_at.isoformat() if e.paid_at else None,
        'paid_method': e.paid_method,
        'paid_by_name': e.paid_by.display_name if e.paid_by_id else '',
        'paid_note': e.paid_note,
        'reject_reason': e.reject_reason,
        'approvals': _approval_rows(e),
        'current_step': ({'step_order': cur.step_order, 'role': cur.role, 'label': cur.label} if cur else None),
        'can_i_approve': bool(user and e.status == 'cho_duyet' and _can_act(user, cur)),
        # Tra gop
        'is_installment': e.is_installment,
        'so_ky': e.so_ky,
        'ky_dau': e.ky_dau.isoformat() if hasattr(e.ky_dau, 'isoformat') else (e.ky_dau or None),
        'paid_amount': e.paid_amount,
        'remaining': e.remaining,
        'payouts': [{
            'id': p.id, 'ky_no': p.ky_no,
            'due_date': p.due_date.isoformat() if p.due_date else None,
            'amount': int(p.amount), 'method': p.method, 'status': p.status,
            'paid_at': p.paid_at.isoformat() if p.paid_at else None,
            'paid_by_name': p.paid_by.display_name if p.paid_by_id else '',
        } for p in e.payouts.all()],
    }


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def expense_list_create(request):
    """GET: danh sach de xuat chi. Query: status, category, clinic_id, scope=mine|to_approve|all.
    POST: tao de xuat chi moi -> tu sinh chuoi duyet theo loai + so tien."""
    if request.method == 'POST':
        d = request.data or {}
        amount = _num(d.get('amount'))
        if amount <= 0:
            return Response({'detail': 'So tien phai lon hon 0.'}, status=400)
        title = (d.get('title') or '').strip()
        if not title:
            return Response({'detail': 'Thieu noi dung chi.'}, status=400)
        category = d.get('category') or 'khac'
        chain = build_expense_chain(category, amount, getattr(request.user, 'role', None))
        with transaction.atomic():
            e = ExpenseRequest.objects.create(
                code=_next_code(),
                clinic_id=d.get('clinic_id') or None,
                category=category,
                title=title,
                reason=d.get('reason', ''),
                amount=amount,
                payment_method=d.get('payment_method', 'cash'),
                co_hoa_don_vat=bool(d.get('co_hoa_don_vat', False)),
                so_ky=int(d.get('so_ky') or 0),
                ky_dau=_parse_date(d.get('ky_dau')),
                chung_tu=d.get('chung_tu') or [],
                chung_tu_note=d.get('chung_tu_note', ''),
                status='cho_duyet' if chain else 'da_duyet',
                requested_by=request.user,
            )
            for step in chain:
                ExpenseApproval.objects.create(request=e, **step)
            if not chain:  # tu duyet -> sinh lich tra gop ngay
                generate_expense_payouts(e)
        return Response(_expense_row(e, request.user), status=201)

    # GET
    qs = ExpenseRequest.objects.select_related('clinic', 'requested_by', 'paid_by').prefetch_related('approvals__approver', 'payouts__paid_by').filter(is_deleted=False)
    status = request.query_params.get('status')
    category = request.query_params.get('category')
    clinic_id = request.query_params.get('clinic_id')
    scope = request.query_params.get('scope')
    if status:
        qs = qs.filter(status=status)
    if category:
        qs = qs.filter(category=category)
    if clinic_id:
        qs = qs.filter(clinic_id=clinic_id)
    if scope == 'mine':
        qs = qs.filter(requested_by=request.user)
    rows = [_expense_row(e, request.user) for e in qs[:500]]
    if scope == 'to_approve':
        rows = [r for r in rows if r['can_i_approve']]
    return Response(rows)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def expense_approve(request, pk):
    """Ky duyet buoc hien tai. Body tuy chon {note}. Ky tuan tu theo step_order."""
    e = ExpenseRequest.objects.filter(pk=pk, is_deleted=False).first()
    if not e:
        return Response({'detail': 'Khong tim thay de xuat chi.'}, status=404)
    if e.status != 'cho_duyet':
        return Response({'detail': 'De xuat khong o trang thai cho duyet.'}, status=400)
    step = e.current_step
    if not _can_act(request.user, step):
        return Response({'detail': 'Ban khong phai nguoi duyet buoc nay.'}, status=403)
    with transaction.atomic():
        step.status = 'duyet'
        step.approver = request.user
        step.acted_at = timezone.now()
        step.note = request.data.get('note', '')
        step.save(update_fields=['status', 'approver', 'acted_at', 'note'])
        if e.is_fully_approved:
            e.status = 'da_duyet'
            e.save(update_fields=['status'])
            generate_expense_payouts(e)  # tra gop: sinh lich khi duyet xong
    e.refresh_from_db()
    return Response(_expense_row(e, request.user))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def expense_reject(request, pk):
    """Tu choi de xuat chi tai buoc hien tai. Body {reason}."""
    e = ExpenseRequest.objects.filter(pk=pk, is_deleted=False).first()
    if not e:
        return Response({'detail': 'Khong tim thay de xuat chi.'}, status=404)
    if e.status != 'cho_duyet':
        return Response({'detail': 'De xuat khong o trang thai cho duyet.'}, status=400)
    step = e.current_step
    if not _can_act(request.user, step):
        return Response({'detail': 'Ban khong phai nguoi duyet buoc nay.'}, status=403)
    reason = (request.data.get('reason') or '').strip()
    with transaction.atomic():
        step.status = 'tu_choi'
        step.approver = request.user
        step.acted_at = timezone.now()
        step.note = reason
        step.save(update_fields=['status', 'approver', 'acted_at', 'note'])
        e.status = 'tu_choi'
        e.reject_reason = reason
        e.rejected_by = request.user
        e.save(update_fields=['status', 'reject_reason', 'rejected_by'])
    e.refresh_from_db()
    return Response(_expense_row(e, request.user))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def expense_pay(request, pk):
    """Ghi 'da chi' sau khi duyet xong (feed so quy chi). Body {paid_method, paid_at, note}."""
    if getattr(request.user, 'role', None) not in PAY_ROLES:
        return Response({'detail': 'Khong co quyen ghi chi.'}, status=403)
    e = ExpenseRequest.objects.filter(pk=pk, is_deleted=False).first()
    if not e:
        return Response({'detail': 'Khong tim thay de xuat chi.'}, status=404)
    if e.is_installment:
        return Response({'detail': 'Mua tra gop: ghi chi tung ky o lich tra gop.'}, status=400)
    if e.status != 'da_duyet':
        return Response({'detail': 'Chi duoc ghi chi khi de xuat da duyet xong.'}, status=400)
    paid_at = request.data.get('paid_at') or timezone.localdate().isoformat()
    try:
        d = timezone.datetime.strptime(paid_at, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        d = timezone.localdate()
    e.status = 'da_chi'
    e.paid_by = request.user
    e.paid_at = d
    e.paid_method = request.data.get('paid_method') or e.payment_method
    e.paid_note = request.data.get('note', '')
    e.save(update_fields=['status', 'paid_by', 'paid_at', 'paid_method', 'paid_note'])
    return Response(_expense_row(e, request.user))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def expense_edit(request, pk):
    """Nguoi tao sua lai de xuat (khi cho_duyet hoac bi tu_choi) -> dung lai chuoi duyet."""
    e = ExpenseRequest.objects.filter(pk=pk, is_deleted=False).first()
    if not e:
        return Response({'detail': 'Khong tim thay de xuat chi.'}, status=404)
    if e.status not in ('cho_duyet', 'tu_choi'):
        return Response({'detail': 'Chi sua duoc khi cho duyet hoac bi tu choi.'}, status=400)
    is_owner = (e.requested_by_id == request.user.id) or getattr(request.user, 'role', None) in MANAGEMENT_ROLES
    if not is_owner:
        return Response({'detail': 'Chi nguoi tao (hoac quan ly) duoc sua.'}, status=403)
    d = request.data or {}
    amount = _num(d.get('amount')) or int(e.amount)
    category = d.get('category') or e.category
    chain = build_expense_chain(category, amount, getattr(e.requested_by, 'role', None))
    with transaction.atomic():
        e.title = (d.get('title') or e.title).strip()
        e.reason = d.get('reason', e.reason)
        e.amount = amount
        e.category = category
        e.payment_method = d.get('payment_method', e.payment_method)
        e.co_hoa_don_vat = bool(d.get('co_hoa_don_vat', e.co_hoa_don_vat))
        e.so_ky = int(d.get('so_ky') or e.so_ky or 0)
        e.ky_dau = _parse_date(d.get('ky_dau')) or e.ky_dau
        e.chung_tu = d.get('chung_tu', e.chung_tu)
        e.chung_tu_note = d.get('chung_tu_note', e.chung_tu_note)
        e.status = 'cho_duyet' if chain else 'da_duyet'
        e.reject_reason = ''
        e.rejected_by = None
        e.save()
        # Dung lai chuoi duyet moi theo loai + so tien (bo buoc nguoi de xuat phai ky)
        e.approvals.all().delete()
        for step in chain:
            ExpenseApproval.objects.create(request=e, **step)
        # Dung lai lich tra gop (chi khi chua chi ky nao)
        if not e.payouts.filter(status='da_chi').exists():
            e.payouts.all().delete()
            if not chain:
                generate_expense_payouts(e)
    e.refresh_from_db()
    return Response(_expense_row(e, request.user))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def expense_delete(request, pk):
    """Xoa mem de xuat chi (nguoi tao khi chua chi, hoac quan ly)."""
    e = ExpenseRequest.objects.filter(pk=pk, is_deleted=False).first()
    if not e:
        return Response({'detail': 'Khong tim thay.'}, status=404)
    is_owner = (e.requested_by_id == request.user.id) or getattr(request.user, 'role', None) in MANAGEMENT_ROLES
    if not is_owner:
        return Response({'detail': 'Khong co quyen xoa.'}, status=403)
    if e.status == 'da_chi':
        return Response({'detail': 'Da chi roi, khong xoa duoc.'}, status=400)
    e.is_deleted = True
    e.save(update_fields=['is_deleted'])
    return Response({'ok': True})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def expense_payout_pay(request, pk):
    """Ghi chi 1 KY tra gop. Body {method, paid_at, note}. Het ky -> de xuat chuyen 'da_chi'."""
    if getattr(request.user, 'role', None) not in PAY_ROLES:
        return Response({'detail': 'Khong co quyen ghi chi.'}, status=403)
    po = ExpensePayout.objects.select_related('request').filter(pk=pk).first()
    if not po:
        return Response({'detail': 'Khong tim thay ky tra gop.'}, status=404)
    e = po.request
    if e.status not in ('da_duyet', 'da_chi'):
        return Response({'detail': 'De xuat chua duyet xong.'}, status=400)
    if po.status == 'da_chi':
        return Response({'detail': 'Ky nay da chi roi.'}, status=400)
    paid_at = request.data.get('paid_at') or timezone.localdate().isoformat()
    try:
        po.paid_at = timezone.datetime.strptime(paid_at, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        po.paid_at = timezone.localdate()
    po.status = 'da_chi'
    po.paid_by = request.user
    po.method = request.data.get('method') or po.method
    po.note = request.data.get('note', '')
    po.save()
    if not e.payouts.filter(status='cho_chi').exists():
        e.status = 'da_chi'
        e.save(update_fields=['status'])
    e.refresh_from_db()
    return Response(_expense_row(e, request.user))


def _cash_net(clinic_id, after=None, before=None):
    """Thu TM - chi TM - nop quy, cho cac ngay THUC SU trong (after, before). after/before la date-string YYYY-MM-DD hoac None."""
    pays = Payment.objects.filter(cash_amount__gt=0, received_at__isnull=False)
    exps = ExpenseRequest.objects.filter(status='da_chi', paid_method='cash', paid_at__isnull=False, is_deleted=False).exclude(payment_method='installment')
    pos = ExpensePayout.objects.filter(status='da_chi', method='cash', paid_at__isnull=False, request__is_deleted=False)
    nops = CashDeposit.objects.all()
    if after:
        pays = pays.filter(received_at__gt=after); exps = exps.filter(paid_at__gt=after); pos = pos.filter(paid_at__gt=after); nops = nops.filter(date__gt=after)
    if before:
        pays = pays.filter(received_at__lt=before); exps = exps.filter(paid_at__lt=before); pos = pos.filter(paid_at__lt=before); nops = nops.filter(date__lt=before)
    if clinic_id:
        pays = pays.filter(contract__clinic_id=clinic_id); exps = exps.filter(clinic_id=clinic_id); pos = pos.filter(request__clinic_id=clinic_id); nops = nops.filter(clinic_id=clinic_id)
    thu = sum(int(p.cash_amount) for p in pays)
    chi = sum(int(e.amount) for e in exps) + sum(int(x.amount) for x in pos)
    nop = sum(int(n.amount) for n in nops)
    return thu - chi - nop


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cash_book(request):
    """So quy tien mat: so du dau ky + thu TM - chi TM - nop quy = ton cuoi ky.
    So du dau ky lay tu lan DOI SOAT KET gan nhat truoc 'from' (tien_dem) + phat sinh toi dau ky.
    Query: from, to (YYYY-MM-DD), clinic_id."""
    if getattr(request.user, 'role', None) not in PAY_ROLES:
        return Response({'detail': 'Khong co quyen.'}, status=403)
    frm = request.query_params.get('from')
    to = request.query_params.get('to')
    clinic_id = request.query_params.get('clinic_id') or None

    so_du_dau = 0
    anchor = None
    if frm:
        aq = CashReconciliation.objects.filter(date__lt=frm)
        if clinic_id:
            aq = aq.filter(clinic_id=clinic_id)
        anchor = aq.order_by('-date').first()
        if anchor:
            so_du_dau = int(anchor.tien_dem) + _cash_net(clinic_id, after=anchor.date.isoformat(), before=frm)
        else:
            so_du_dau = _cash_net(clinic_id, after=None, before=frm)

    pays = Payment.objects.select_related('contract', 'received_by').filter(cash_amount__gt=0, received_at__isnull=False)
    exps = ExpenseRequest.objects.select_related('clinic', 'paid_by').filter(status='da_chi', paid_method='cash', paid_at__isnull=False, is_deleted=False).exclude(payment_method='installment')
    pos = ExpensePayout.objects.select_related('request', 'paid_by').filter(status='da_chi', method='cash', paid_at__isnull=False, request__is_deleted=False)
    nops = CashDeposit.objects.select_related('deposited_by').all()
    if frm:
        pays = pays.filter(received_at__gte=frm); exps = exps.filter(paid_at__gte=frm); pos = pos.filter(paid_at__gte=frm); nops = nops.filter(date__gte=frm)
    if to:
        pays = pays.filter(received_at__lte=to); exps = exps.filter(paid_at__lte=to); pos = pos.filter(paid_at__lte=to); nops = nops.filter(date__lte=to)
    if clinic_id:
        pays = pays.filter(contract__clinic_id=clinic_id); exps = exps.filter(clinic_id=clinic_id); pos = pos.filter(request__clinic_id=clinic_id); nops = nops.filter(clinic_id=clinic_id)

    rows = []
    tong_thu = tong_chi = tong_nop = 0
    for p in pays:
        amt = int(p.cash_amount); tong_thu += amt
        rows.append({'kind': 'thu', 'date': p.received_at.isoformat(), 'amount': amt, 'label': f'Thu TM HĐ {p.contract.contract_no}', 'ref': p.contract.contract_no, 'by_name': p.received_by.display_name if p.received_by_id else ''})
    for e in exps:
        amt = int(e.amount); tong_chi += amt
        rows.append({'kind': 'chi', 'date': e.paid_at.isoformat(), 'amount': amt, 'label': f'{e.get_category_display()}: {e.title}', 'ref': e.code, 'by_name': e.paid_by.display_name if e.paid_by_id else ''})
    for po in pos:
        amt = int(po.amount); tong_chi += amt
        rows.append({'kind': 'chi', 'date': po.paid_at.isoformat(), 'amount': amt, 'label': f'Trả góp kỳ {po.ky_no}/{po.request.so_ky}: {po.request.title}', 'ref': po.request.code, 'by_name': po.paid_by.display_name if po.paid_by_id else ''})
    for n in nops:
        amt = int(n.amount); tong_nop += amt
        rows.append({'kind': 'nop', 'date': n.date.isoformat(), 'amount': amt, 'label': 'Nộp quỹ ngân hàng' + ((' - ' + n.bank_note) if n.bank_note else ''), 'ref': '', 'by_name': n.deposited_by.display_name if n.deposited_by_id else ''})
    order = {'thu': 0, 'chi': 1, 'nop': 2}
    rows.sort(key=lambda r: (r['date'], order.get(r['kind'], 9)), reverse=True)
    ton_cuoi = so_du_dau + tong_thu - tong_chi - tong_nop
    return Response({
        'rows': rows,
        'summary': {
            'so_du_dau': so_du_dau,
            'tong_thu': tong_thu,
            'tong_chi': tong_chi,
            'tong_nop': tong_nop,
            'ton_cuoi': ton_cuoi,
            'chenh': tong_thu - tong_chi,
            'anchor_date': anchor.date.isoformat() if anchor else None,
        },
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def cash_deposit(request):
    """Phieu nop quy ngan hang. GET: danh sach gan day. POST {date, amount, bank_note, note, clinic_id}."""
    if getattr(request.user, 'role', None) not in PAY_ROLES:
        return Response({'detail': 'Khong co quyen.'}, status=403)
    if request.method == 'GET':
        qs = CashDeposit.objects.select_related('clinic', 'deposited_by').all()[:100]
        return Response([{
            'id': d.id, 'date': d.date.isoformat(), 'amount': int(d.amount),
            'bank_note': d.bank_note, 'note': d.note,
            'clinic_name': d.clinic.name if d.clinic_id else '(Chung)',
            'by_name': d.deposited_by.display_name if d.deposited_by_id else '',
        } for d in qs])
    data = request.data or {}
    amount = _num(data.get('amount'))
    if amount <= 0:
        return Response({'detail': 'So tien nop phai lon hon 0.'}, status=400)
    d = CashDeposit.objects.create(
        clinic_id=data.get('clinic_id') or None,
        date=_parse_date(data.get('date')) or timezone.localdate(),
        amount=amount,
        bank_note=data.get('bank_note', ''),
        note=data.get('note', ''),
        deposited_by=request.user,
    )
    return Response({'id': d.id, 'date': d.date.isoformat(), 'amount': int(d.amount)}, status=201)
