from decimal import Decimal
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum

from .models import SalaryConfig, MonthlySalary, CommissionRate, COMMISSION_ROLE_CHOICES
from .serializers import (
    SalaryConfigSerializer, MonthlySalarySerializer,
    SalaryCalculateSerializer, SalaryApproveSerializer,
    CommissionRateSerializer,
)

FULL_HR = frozenset(['QUAN_LY', 'CHU_DN', 'KE_TOAN'])

# Vai tro an hoa hong qua ContractCredit (acquisition) thay vi nguoi_ban
ACQUISITION_ROLES = frozenset(['TELE', 'LEAD_TELE', 'MKT', 'LEAD_MKT', 'TRUC_PAGE', 'LEAD_TRUC_PAGE'])
ROLE_TO_CREDIT = {
    'TELE': 'TELE', 'LEAD_TELE': 'TELE',
    'MKT': 'ADS', 'LEAD_MKT': 'ADS',
    'TRUC_PAGE': 'TRUC_PAGE', 'LEAD_TRUC_PAGE': 'TRUC_PAGE',
}


def _is_hr(user):
    return user.role in FULL_HR


# ─── Helpers tinh P3 (Performance) ────────────────────────────────────────────

def _thuc_thu_thang(contract, year, month):
    """Thuc thu cua 1 HD phat sinh trong thang (neo theo Payment.received_at, chi tinh phieu da xac nhan)."""
    total = 0
    for p in contract.payments.filter(received_at__year=year, received_at__month=month,
                                       verify_status='da_xac_nhan'):
        total += p.settled_total
    return total


def _is_first_contract(contract):
    """HD dau tien cua khach (de Tele chi an hoa hong HD dau)."""
    from apps.contracts.models import Contract
    first = Contract.objects.filter(
        customer_id=contract.customer_id, approval_status='approved', is_deleted=False,
    ).order_by('created_at', 'id').first()
    return bool(first and first.id == contract.id)


def _commission_for(user, year, month):
    """Hoa hong P3 theo thuc thu trong thang x rate vai tro (upsale rate rieng).
    - Acquisition (tele/mkt/page): theo ContractCredit (Tele chi HD dau).
    - Con lai (sale/cskh/bs/ktv): theo nguoi_ban."""
    from apps.contracts.models import Contract, ContractCredit
    rate = CommissionRate.objects.filter(role=user.role).first()
    if not rate:
        return Decimal('0')
    pct = float(rate.percent)
    pct_up = float(rate.percent_upsale)
    total = 0.0

    if user.role in ACQUISITION_ROLES:
        credit_role = ROLE_TO_CREDIT.get(user.role)
        credits = ContractCredit.objects.filter(
            user=user, role=credit_role,
            contract__approval_status='approved', contract__is_deleted=False,
        ).select_related('contract')
        for cr in credits:
            c = cr.contract
            if credit_role == 'TELE' and not _is_first_contract(c):
                continue
            tt = _thuc_thu_thang(c, year, month)
            if tt <= 0:
                continue
            r = pct_up if c.sale_round == 'upsale' else pct
            total += float(tt) * r / 100
    else:
        contracts = Contract.objects.filter(
            nguoi_ban=user, approval_status='approved', is_deleted=False,
        )
        for c in contracts:
            tt = _thuc_thu_thang(c, year, month)
            if tt <= 0:
                continue
            r = pct_up if c.sale_round == 'upsale' else pct
            total += float(tt) * r / 100

    return Decimal(str(round(total)))


def _tua_for(user, year, month):
    """Tua P3: tong cac dong TuaAllocation DA XAC NHAN cua nguoi nay, neo theo thang check-out buoi.
    Dong cho_xac_nhan / tu_choi / huy KHONG tinh (maker-checker 2 lop)."""
    from apps.contracts.models import TuaAllocation
    agg = TuaAllocation.objects.filter(
        user=user, status='da_xac_nhan',
        appointment__checked_out_at__year=year,
        appointment__checked_out_at__month=month,
    ).aggregate(s=Sum('amount'))
    return Decimal(str(int(agg['s'] or 0)))


# ─── SalaryConfig ─────────────────────────────────────────────────────────────

class SalaryConfigListView(generics.ListAPIView):
    """GET /api/salary/configs/ — HR xem tất cả cấu hình lương."""
    permission_classes = [IsAuthenticated]
    serializer_class = SalaryConfigSerializer

    def get_queryset(self):
        if not _is_hr(self.request.user):
            return SalaryConfig.objects.filter(user=self.request.user)
        return SalaryConfig.objects.select_related('user').all()


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def salary_config_detail(request, user_id):
    """GET/PUT /api/salary/configs/{user_id}/"""
    if not _is_hr(request.user) and request.user.id != int(user_id):
        return Response({'detail': 'Không có quyền.'}, status=403)
    from django.contrib.auth import get_user_model
    User = get_user_model()
    user = User.objects.filter(pk=user_id).first()
    if not user:
        return Response({'detail': 'Nhân viên không tồn tại.'}, status=404)
    config, _ = SalaryConfig.objects.get_or_create(user=user, defaults={'base_salary': 0})
    if request.method == 'GET':
        return Response(SalaryConfigSerializer(config).data)
    if not _is_hr(request.user):
        return Response({'detail': 'Không có quyền cập nhật.'}, status=403)
    s = SalaryConfigSerializer(config, data=request.data, partial=True)
    if s.is_valid():
        s.save()
        return Response(s.data)
    return Response(s.errors, status=400)


# ─── CommissionRate (% hoa hong theo vai tro) ─────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def commission_rate_list(request):
    """GET /api/salary/commission-rates/ — tra ve day du 12 vai tro (tao row thieu voi 0)."""
    existing = {r.role: r for r in CommissionRate.objects.all()}
    rows = []
    for role, _label in COMMISSION_ROLE_CHOICES:
        obj = existing.get(role)
        if obj is None:
            obj = CommissionRate.objects.create(role=role)
        rows.append(obj)
    return Response(CommissionRateSerializer(rows, many=True).data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def commission_rate_update(request, role):
    """PUT /api/salary/commission-rates/{role}/ — HR chinh % cho 1 vai tro."""
    if not _is_hr(request.user):
        return Response({'detail': 'Không có quyền cập nhật tỷ lệ hoa hồng.'}, status=403)
    valid = {r for r, _ in COMMISSION_ROLE_CHOICES}
    if role not in valid:
        return Response({'detail': 'Vai trò không hợp lệ.'}, status=400)
    obj, _ = CommissionRate.objects.get_or_create(role=role)
    s = CommissionRateSerializer(obj, data=request.data, partial=True)
    if s.is_valid():
        s.save()
        return Response(s.data)
    return Response(s.errors, status=400)


# ─── Service tua rate (don gia tua moi dich vu) ───────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def service_tua_list(request):
    """GET /api/salary/service-tua/ — danh sach dich vu + don gia tua."""
    from apps.services.models import Service
    data = [
        {
            'id': s.id, 'name': s.name,
            'category': s.category.name if s.category_id else '',
            'unit_price': int(s.unit_price), 'tua_rate': int(s.tua_rate or 0),
            'is_active': s.is_active,
        }
        for s in Service.objects.select_related('category').filter(is_active=True).order_by('category__name', 'name')
    ]
    return Response(data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def service_tua_update(request, service_id):
    """PUT /api/salary/service-tua/{service_id}/ — set don gia tua cho 1 dich vu."""
    if not _is_hr(request.user):
        return Response({'detail': 'Không có quyền cập nhật đơn giá tua.'}, status=403)
    from apps.services.models import Service
    svc = Service.objects.filter(pk=service_id).first()
    if not svc:
        return Response({'detail': 'Dịch vụ không tồn tại.'}, status=404)
    try:
        svc.tua_rate = int(request.data.get('tua_rate', 0) or 0)
    except (ValueError, TypeError):
        return Response({'detail': 'tua_rate không hợp lệ.'}, status=400)
    svc.save(update_fields=['tua_rate'])
    return Response({'id': svc.id, 'name': svc.name, 'tua_rate': int(svc.tua_rate)})


# ─── Bảng tua / Chia tua (maker-checker 2 lớp, gắn Appointment) ────────────────

_TUA_MANAGE_ROLES = frozenset(['LE_TAN', 'KE_TOAN', 'QUAN_LY', 'CHU_DN'])


def _tua_alloc_row(a, me=None):
    appt = a.appointment
    cust = appt.customer if (appt and appt.customer_id) else None
    checked_out = bool(appt and appt.checked_out_at)
    counts_salary = (a.status == 'da_xac_nhan') and checked_out  # chỉ cái này mới vào lương P3
    return {
        'id': a.id,
        'appointment': a.appointment_id,
        'checked_out': checked_out,
        'counts_salary': counts_salary,
        'date': appt.checked_out_at.date().isoformat() if (appt and appt.checked_out_at) else (appt.scheduled_at.date().isoformat() if appt and appt.scheduled_at else None),
        'customer': cust.full_name if cust else '',
        'phone': cust.phone if cust else '',
        'source': cust.source if cust else '',
        'source_display': cust.get_source_display() if (cust and cust.source) else '',
        'customer_group': cust.customer_group if cust else '',
        'province': cust.province if cust else '',
        'data_type': cust.data_type if cust else '',
        'data_type_display': cust.get_data_type_display() if (cust and cust.data_type) else '',
        'visit_type': appt.visit_type if appt else '',
        'visit_type_display': appt.get_visit_type_display() if (appt and appt.visit_type) else '',
        'service': a.service_name,
        'user': a.user_id,
        'user_name': (a.user.get_full_name() or a.user.email) if a.user_id else '',
        'role': a.role,
        'role_display': a.get_role_display(),
        'amount': int(a.amount or 0),
        'status': a.status,
        'status_display': a.get_status_display(),
        'reject_reason': a.reject_reason,
        'confirmed_at': a.confirmed_at,
        'can_i_confirm': bool(me and a.user_id == me.id and a.status in ('cho_xac_nhan', 'tu_choi')),
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def tua_alloc_list(request):
    """GET /api/salary/tua-allocations/?year=&month=&date=&status=&mine=1
    Lễ tân/KT/QL thấy tất cả; nhân sự khác chỉ thấy phần tua của mình."""
    from apps.contracts.models import TuaAllocation
    qs = TuaAllocation.objects.select_related('appointment__customer', 'user').all()

    # Loc theo NGAY HEN (scheduled_at) de le tan thay ca phan tua CHUA check-out (dang cho xac nhan).
    # Luong van neo rieng theo checked_out_at (xem _tua_for).
    date_f = request.query_params.get('date')
    if date_f:
        qs = qs.filter(appointment__scheduled_at__date=date_f)
    else:
        try:
            year = int(request.query_params.get('year', timezone.now().year))
            month = int(request.query_params.get('month', timezone.now().month))
        except ValueError:
            return Response({'detail': 'year/month không hợp lệ.'}, status=400)
        qs = qs.filter(appointment__scheduled_at__year=year, appointment__scheduled_at__month=month)

    mine = request.query_params.get('mine') in ('1', 'true', 'True')
    can_manage = request.user.role in _TUA_MANAGE_ROLES
    if mine or not can_manage:
        qs = qs.filter(user=request.user)

    status_f = request.query_params.get('status')
    if status_f:
        qs = qs.filter(status=status_f)

    rows = [_tua_alloc_row(a, request.user) for a in qs]
    summary = {
        'total': len(rows),
        'cho_xac_nhan': sum(1 for r in rows if r['status'] == 'cho_xac_nhan'),
        'da_xac_nhan': sum(1 for r in rows if r['status'] == 'da_xac_nhan'),
        'tu_choi': sum(1 for r in rows if r['status'] == 'tu_choi'),
        'huy': sum(1 for r in rows if r['status'] == 'huy'),
        # da_xac_nhan nhung CHUA check-out -> chua tinh luong
        'cho_checkout': sum(1 for r in rows if r['status'] == 'da_xac_nhan' and not r['counts_salary']),
        'da_tinh_luong': sum(1 for r in rows if r['counts_salary']),
        'tong_tua': sum(r['amount'] for r in rows if r['status'] == 'da_xac_nhan'),
        # CHI tua da xac nhan + DA check-out moi vao luong (khop _tua_for)
        'tong_tinh_luong': sum(r['amount'] for r in rows if r['counts_salary']),
        'results': rows,
    }
    return Response(summary)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def tua_alloc_confirm(request, pk):
    """POST /api/salary/tua-allocations/{id}/confirm/ — {action:'confirm'|'reject', reason}
    Lớp 2: chỉ người được chia (hoặc QL/Chủ DN) xác nhận — checker ≠ lễ tân chia."""
    from apps.contracts.models import TuaAllocation
    a = TuaAllocation.objects.filter(pk=pk).select_related('user', 'appointment').first()
    if not a:
        return Response({'detail': 'Không tìm thấy phần tua.'}, status=404)
    if a.status == 'huy':
        return Response({'detail': 'Phần tua này đã bị hủy.'}, status=400)

    is_mgmt = request.user.role in ('QUAN_LY', 'CHU_DN')
    if not (is_mgmt or a.user_id == request.user.id):
        return Response({'detail': 'Chỉ người được chia tua mới được xác nhận.'}, status=403)

    action = request.data.get('action')
    if action == 'confirm':
        a.status = 'da_xac_nhan'
        a.reject_reason = ''
    elif action == 'reject':
        a.status = 'tu_choi'
        a.reject_reason = request.data.get('reason', '') or ''
    else:
        return Response({'detail': "action phải là 'confirm' hoặc 'reject'."}, status=400)
    a.confirmed_at = timezone.now()
    a.save(update_fields=['status', 'reject_reason', 'confirmed_at'])

    # Cap nhat trang thai tin tua trong cuoc tro chuyen He thong + ghi nhat ky giam sat
    try:
        from apps.chat.tua_messages import update_tua_message_status, log_tua
        update_tua_message_status(a)
        log_tua(a, 'xac_nhan' if action == 'confirm' else 'tu_choi', reason=a.reject_reason or '')
    except Exception:
        pass

    # Tu choi -> bao nguoc cho le tan da chia + QL/CDN/KT (chuong noi bat) de chia lai
    if action == 'reject':
        try:
            from apps.contracts.tua_sync import _notify
            khach = a.appointment.customer.full_name if (a.appointment and a.appointment.customer_id) else ''
            who = a.user.get_full_name() or a.user.email
            msg = f'{who} TỪ CHỐI tua {a.get_role_display()} buổi "{khach}". Lý do: {a.reject_reason or "—"}. Cần chia lại.'
            if a.created_by_id:
                _notify(a.created_by, 'Tua bị từ chối', msg, {'appointment': a.appointment_id, 'tua_id': a.id})
            from apps.chat.notifications import send_notification_to_roles
            send_notification_to_roles(['LE_TAN', 'QUAN_LY', 'CHU_DN', 'KE_TOAN'], 'general', 'Tua bị từ chối', body=msg,
                                       data={'appointment': a.appointment_id, 'tua_id': a.id})
        except Exception:
            pass

    return Response(_tua_alloc_row(a, request.user))


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def tua_alloc_edit(request, pk):
    """PUT /api/salary/tua-allocations/{id}/ — lễ tân/KT sửa số tua → reset về chờ xác nhận + báo lại."""
    from apps.contracts.models import TuaAllocation
    if request.user.role not in _TUA_MANAGE_ROLES:
        return Response({'detail': 'Không có quyền sửa tua.'}, status=403)
    a = TuaAllocation.objects.filter(pk=pk).select_related('user', 'appointment__customer').first()
    if not a:
        return Response({'detail': 'Không tìm thấy phần tua.'}, status=404)
    if a.status == 'huy':
        return Response({'detail': 'Phần tua đã hủy, không sửa được.'}, status=400)
    try:
        new_amount = int(request.data.get('amount', a.amount) or 0)
    except (ValueError, TypeError):
        return Response({'detail': 'amount không hợp lệ.'}, status=400)

    changed = new_amount != int(a.amount or 0)
    a.amount = new_amount
    if changed:
        a.status = 'cho_xac_nhan'   # doi so -> can xac nhan lai (chong lech ngam)
        a.reject_reason = ''
        a.confirmed_at = None
    a.save(update_fields=['amount', 'status', 'reject_reason', 'confirmed_at'])
    if changed:
        # Dong bo lai the tua trong chat (ve cho_xac_nhan -> hien lai nut) + log giam sat
        try:
            from apps.chat.tua_messages import update_tua_message_status, log_tua
            update_tua_message_status(a)
            log_tua(a, 'sua')
        except Exception:
            pass
        try:
            from apps.contracts.tua_sync import _notify
            khach = a.appointment.customer.full_name if a.appointment and a.appointment.customer_id else ''
            # KHONG kem so tien (chi ke toan thay gia) — chi bao can xac nhan lai
            _notify(a.user, 'Tua cập nhật',
                    f'Phần tua {a.get_role_display()} buổi "{khach}" vừa được điều chỉnh. Vui lòng xác nhận lại.',
                    {'appointment': a.appointment_id, 'tua_id': a.id})
        except Exception:
            pass
    return Response(_tua_alloc_row(a, request.user))


# ─── Bảng lương tháng ─────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def monthly_salary(request):
    """
    GET /api/salary/monthly/?year=2026&month=5
    HR → tất cả nhân viên. Nhân viên thường → chỉ của mình.
    """
    try:
        year = int(request.query_params.get('year', timezone.now().year))
        month = int(request.query_params.get('month', timezone.now().month))
    except ValueError:
        return Response({'detail': 'year/month không hợp lệ.'}, status=400)

    qs = MonthlySalary.objects.filter(year=year, month=month).select_related('user', 'approved_by')
    if not _is_hr(request.user):
        qs = qs.filter(user=request.user)

    data = MonthlySalarySerializer(qs, many=True).data
    summary = {
        'year': year, 'month': month,
        'total_staff': qs.count(),
        'total_payout': sum(float(r['total']) for r in data),
        'approved': qs.filter(status='approved').count(),
        'paid': qs.filter(status='paid').count(),
        'draft': qs.filter(status='draft').count(),
        'records': data,
    }
    return Response(summary)


# ─── Tính lương tự động (3P + BH + TNCN → net) ────────────────────────────────

# Bảo hiểm bắt buộc phần NV đóng: BHXH 8% + BHYT 1.5% + BHTN 1% = 10.5%
BH_RATE_NV = 0.105
GIAM_TRU_BAN_THAN = 11_000_000      # /tháng
GIAM_TRU_NGUOI_PHU_THUOC = 4_400_000  # /tháng/người
# Biểu thuế TNCN lũy tiến từng phần (7 bậc, theo tháng): (trần bậc, thuế suất)
_TNCN_BRACKETS = [
    (5_000_000, 0.05), (10_000_000, 0.10), (18_000_000, 0.15),
    (32_000_000, 0.20), (52_000_000, 0.25), (80_000_000, 0.30), (float('inf'), 0.35),
]


def _tncn(assessable):
    """Thuế TNCN lũy tiến từng phần. assessable = thu nhập tính thuế/tháng (đã trừ BH + giảm trừ)."""
    if assessable <= 0:
        return 0.0
    tax, lower = 0.0, 0
    for upper, rate in _TNCN_BRACKETS:
        if assessable > lower:
            tax += (min(assessable, upper) - lower) * rate
            lower = upper
        else:
            break
    return tax


def _approved_leave_in_month(user, year, month):
    """Nghỉ phép ĐÃ DUYỆT rơi trong tháng. Trả về (set ngày nghỉ full-day, tổng công nghỉ).
    Quy đổi: cả ngày=1, nửa ngày=0.5, theo giờ=giờ/8. Dùng để: loại ngày đã xin nghỉ khỏi
    'vắng không phép' (nghỉ phép KHÔNG bị phạt) + biết có dữ liệu nghỉ hay chưa.
    Policy phòng khám (chốt 2026-11): CỨ NGHỈ LÀ KHÔNG TÍNH CÔNG ngày đó (chưa có phép năm hưởng lương)."""
    import calendar, datetime as dt
    from apps.attendance.models import LeaveRequest
    first = dt.date(year, month, 1)
    last = dt.date(year, month, calendar.monthrange(year, month)[1])
    full_dates = set()
    total = 0.0
    for lv in LeaveRequest.objects.filter(user=user, status='approved',
                                          start_date__lte=last, end_date__gte=first):
        s = lv.start_date if lv.start_date > first else first
        e = lv.end_date if lv.end_date < last else last
        if e < s:
            continue
        if lv.duration_type in ('half_morning', 'half_afternoon'):
            total += 0.5
        elif lv.duration_type == 'hourly':
            if lv.start_time and lv.end_time:
                hrs = (lv.end_time.hour + lv.end_time.minute / 60.0) - (lv.start_time.hour + lv.start_time.minute / 60.0)
                total += max(0.0, min(hrs / 8.0, 1.0))
            else:
                total += 0.5
        else:
            d = s
            while d <= e:
                full_dates.add(d)
                total += 1.0
                d += dt.timedelta(days=1)
    return full_dates, total


def _calculate_one(user, month, year, overwrite=False):
    """Tính lương 3P cho 1 nhân viên. Returns (instance, created) hoặc (None, False)."""
    existing = MonthlySalary.objects.filter(user=user, month=month, year=year).first()
    if existing and existing.status != 'draft':
        return None, False
    if existing and not overwrite:
        return existing, False

    try:
        cfg = user.salary_config
    except SalaryConfig.DoesNotExist:
        return None, False

    # 1. Chấm công + nghỉ phép (policy: CỨ NGHỈ LÀ KHÔNG TÍNH CÔNG ngày đó; nghỉ đã duyệt KHÔNG phạt)
    from apps.attendance.models import AttendanceRecord, ShiftAssignment
    import calendar, datetime as dt
    att_qs = AttendanceRecord.objects.filter(user=user, date__year=year, date__month=month)

    # Ngày nghỉ phép ĐÃ DUYỆT trong tháng
    leave_dates, leave_days = _approved_leave_in_month(user, year, month)

    PRESENT = ('on_time', 'late', 'early')
    present_days = att_qs.filter(status__in=PRESENT).count()   # ngày thật sự đi làm = hưởng công
    # Vắng KHÔNG phép (trừ công + phạt). Loại ngày đã có đơn nghỉ duyệt → nghỉ phép KHÔNG bị phạt.
    absent_days = att_qs.filter(status='absent').exclude(date__in=leave_dates).count()
    late_minutes_total = sum(r.late_minutes for r in att_qs.filter(status__in=PRESENT))

    working_days = ShiftAssignment.objects.filter(
        user=user, date__year=year, date__month=month,
    ).values('date').distinct().count()
    if working_days == 0:
        working_days = sum(
            1 for d in range(1, calendar.monthrange(year, month)[1] + 1)
            if dt.date(year, month, d).weekday() < 6
        )

    # Công hưởng lương = ngày đi làm thật (nghỉ phép & vắng đều KHÔNG hưởng công).
    actual_days = present_days
    # An toàn: CHƯA có bất kỳ dữ liệu chấm công/nghỉ nào ⇒ coi như đi đủ (chưa bật chấm công) ⇒ trả full P1/P2.
    has_att_data = att_qs.exists() or leave_days > 0
    if not has_att_data:
        ratio = 1.0
    elif working_days:
        ratio = min(present_days / working_days, 1.0)
    else:
        ratio = 0.0

    # 2. P1 — Lương vị trí (chia theo công)
    base = Decimal(str(round(float(cfg.base_salary) * ratio)))
    # 3. P2 — Năng lực + phụ cấp (chia theo công)
    competency = Decimal(str(round(float(cfg.competency_salary) * ratio)))
    allowance = Decimal(str(round(float(cfg.allowance) * ratio)))

    # 4. P3 — Hiệu suất (KHÔNG chia công): hoa hồng thực thu + tua + thưởng tay
    commission = _commission_for(user, year, month)
    tua_income = _tua_for(user, year, month)
    bonus = existing.bonus if existing else Decimal('0')  # giu thuong tay da nhap

    # 5. Khấu trừ kỷ luật (đi muộn / vắng)
    deductions = (
        Decimal(str(int(cfg.late_deduct_per_minute) * late_minutes_total))
        + Decimal(str(int(cfg.absent_deduct_per_day) * absent_days))
    )

    # 6. Bảo hiểm bắt buộc NV đóng (10.5% trên lương đóng BH; mặc định = P1, KHÔNG chia công)
    bh_base = int(cfg.bh_salary) if int(cfg.bh_salary or 0) > 0 else int(cfg.base_salary or 0)
    bh_deduct = Decimal(str(round(bh_base * BH_RATE_NV)))

    # 7. Thuế TNCN lũy tiến (giảm trừ bản thân + người phụ thuộc)
    gross = base + competency + allowance + commission + tua_income + bonus
    assessable = (
        float(gross) - float(bh_deduct)
        - GIAM_TRU_BAN_THAN - GIAM_TRU_NGUOI_PHU_THUOC * int(getattr(cfg, 'dependents', 0) or 0)
    )
    tncn_deduct = Decimal(str(round(_tncn(assessable))))

    # 8. Thực nhận (net) = gross − khấu trừ kỷ luật − BH − TNCN
    total = max(gross - deductions - bh_deduct - tncn_deduct, Decimal('0'))

    salary, created = MonthlySalary.objects.update_or_create(
        user=user, month=month, year=year,
        defaults={
            'working_days': working_days, 'actual_days': actual_days,
            'late_minutes_total': late_minutes_total, 'absent_days': absent_days,
            'base': base, 'competency': competency, 'allowance': allowance,
            'commission': commission, 'tua_income': tua_income, 'bonus': bonus,
            'deductions': deductions, 'bh_deduct': bh_deduct, 'tncn_deduct': tncn_deduct,
            'total': total, 'status': 'draft',
        },
    )
    return salary, created


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calculate_salary(request):
    """
    POST /api/salary/calculate/
    Body: {"month": 5, "year": 2026, "user_ids": [], "overwrite": false}
    """
    if not _is_hr(request.user):
        return Response({'detail': 'Không có quyền tính lương.'}, status=403)

    s = SalaryCalculateSerializer(data=request.data)
    if not s.is_valid():
        return Response(s.errors, status=400)

    from django.contrib.auth import get_user_model
    User = get_user_model()
    month = s.validated_data['month']
    year = s.validated_data['year']
    overwrite = s.validated_data['overwrite']
    user_ids = s.validated_data.get('user_ids')

    users = (
        User.objects.filter(id__in=user_ids, is_active=True)
        if user_ids
        else User.objects.filter(salary_config__isnull=False, is_active=True)
    )

    results = {'calculated': 0, 'skipped': 0, 'errors': []}
    with transaction.atomic():
        for user in users:
            try:
                sal, _ = _calculate_one(user, month, year, overwrite)
                if sal:
                    results['calculated'] += 1
                else:
                    results['skipped'] += 1
            except Exception as e:
                results['errors'].append({'user_id': user.id, 'error': str(e)})

    return Response(results)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_salary(request, pk):
    """
    POST /api/salary/{id}/approve/
    Body: {"action": "approve" | "pay", "notes": "..."}
    """
    if not _is_hr(request.user):
        return Response({'detail': 'Không có quyền duyệt lương.'}, status=403)

    salary = MonthlySalary.objects.filter(pk=pk).select_related('user').first()
    if not salary:
        return Response({'detail': 'Không tìm thấy bản lương.'}, status=404)

    s = SalaryApproveSerializer(data=request.data)
    if not s.is_valid():
        return Response(s.errors, status=400)

    action = s.validated_data['action']
    if action == 'approve':
        if salary.status != 'draft':
            return Response({'detail': 'Chỉ duyệt được bản nháp.'}, status=400)
        salary.status = 'approved'
    else:
        if salary.status != 'approved':
            return Response({'detail': 'Phải duyệt trước khi thanh toán.'}, status=400)
        salary.status = 'paid'

    salary.approved_by = request.user
    salary.approved_at = timezone.now()
    if s.validated_data.get('notes'):
        salary.notes = s.validated_data['notes']
    salary.save()

    try:
        from apps.chat.notifications import send_notification
        label = 'đã được duyệt' if action == 'approve' else 'đã được thanh toán'
        send_notification(
            salary.user, 'general',
            f'Lương {salary.month}/{salary.year} {label}',
            body=f'Tổng: {salary.total:,.0f} VNĐ',
            data={'salary_id': salary.id},
        )
    except Exception:
        pass

    return Response(MonthlySalarySerializer(salary).data)
