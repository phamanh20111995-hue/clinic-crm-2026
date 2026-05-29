from decimal import Decimal
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction

from .models import SalaryConfig, MonthlySalary
from .serializers import (
    SalaryConfigSerializer, MonthlySalarySerializer,
    SalaryCalculateSerializer, SalaryApproveSerializer,
)

FULL_HR = frozenset(['QUAN_LY', 'CHU_DN', 'KE_TOAN'])


def _is_hr(user):
    return user.role in FULL_HR


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


# ─── Tính lương tự động ───────────────────────────────────────────────────────

def _calculate_one(user, month, year, overwrite=False):
    """Tính lương cho 1 nhân viên. Returns (instance, created) hoặc (None, False)."""
    existing = MonthlySalary.objects.filter(user=user, month=month, year=year).first()
    if existing and existing.status != 'draft':
        return None, False
    if existing and not overwrite:
        return existing, False

    try:
        cfg = user.salary_config
    except SalaryConfig.DoesNotExist:
        return None, False

    # 1. Chấm công
    from apps.attendance.models import AttendanceRecord, ShiftAssignment
    import calendar
    att_qs = AttendanceRecord.objects.filter(user=user, date__year=year, date__month=month)
    actual_days = att_qs.exclude(status='absent').count()
    absent_days = att_qs.filter(status='absent').count()
    late_minutes_total = sum(r.late_minutes for r in att_qs)

    working_days = ShiftAssignment.objects.filter(
        user=user, date__year=year, date__month=month,
    ).values('date').distinct().count()
    if working_days == 0:
        import datetime as dt
        working_days = sum(
            1 for d in range(1, calendar.monthrange(year, month)[1] + 1)
            if dt.date(year, month, d).weekday() < 6
        )

    # 2. Lương cơ bản
    daily_base = cfg.base_salary / working_days if working_days else cfg.base_salary
    base = Decimal(str(round(float(daily_base) * actual_days)))

    # 3. Hoa hồng HĐ approved
    from apps.contracts.models import Contract
    commission = Decimal('0')
    if cfg.commission_rate > 0:
        revenue = sum(
            c.final_amount for c in Contract.objects.filter(
                created_by=user, approval_status='approved',
                approved_at__year=year, approved_at__month=month,
                is_deleted=False,
            )
        )
        commission = Decimal(str(round(float(revenue) * float(cfg.commission_rate) / 100)))

    # 4. Thu nhập tua
    from apps.appointments.models import Appointment
    tua_count = Appointment.objects.filter(
        ktv=user, tua_confirmed=True,
        scheduled_at__year=year, scheduled_at__month=month,
    ).count()
    tua_income = Decimal(str(int(cfg.tua_rate) * tua_count))

    # 5. Khấu trừ
    deductions = (
        Decimal(str(int(cfg.late_deduct_per_minute) * late_minutes_total))
        + Decimal(str(int(cfg.absent_deduct_per_day) * absent_days))
    )

    total = max(base + commission + tua_income - deductions, Decimal('0'))

    salary, created = MonthlySalary.objects.update_or_create(
        user=user, month=month, year=year,
        defaults={
            'working_days': working_days, 'actual_days': actual_days,
            'late_minutes_total': late_minutes_total, 'absent_days': absent_days,
            'base': base, 'commission': commission,
            'tua_income': tua_income, 'deductions': deductions,
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
