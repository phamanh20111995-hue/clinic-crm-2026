from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction
from django.contrib.auth import get_user_model

from .models import WorkShift, ShiftAssignment, AttendanceRecord, LeaveRequest
from .pagination import ShiftAssignmentPagination
from .serializers import (
    WorkShiftSerializer, ShiftAssignmentSerializer, ShiftAssignmentCreateSerializer,
    AttendanceRecordSerializer, ManualAttendanceSerializer, ZKTecoSyncSerializer,
    LeaveRequestSerializer, LeaveApproveSerializer,
)

User = get_user_model()

MANAGEMENT_ROLES = frozenset(['QUAN_LY', 'CHU_DN'])
FULL_HR_ROLES = frozenset(['QUAN_LY', 'CHU_DN', 'KE_TOAN'])

LEAVE_APPROVER_MAP = {
    'TELE':           ['LEAD_TELE'],
    'SALE':           ['LEAD_SALE'],
    'CSKH':           ['LEAD_CSKH'],
    'MKT':            ['LEAD_MKT'],
    'TRUC_PAGE':      ['LEAD_TRUC_PAGE'],
    'BS':             ['QUAN_LY', 'CHU_DN'],
    'KTV':            ['QUAN_LY', 'CHU_DN'],
    'LE_TAN':         ['QUAN_LY', 'CHU_DN'],
    'KE_TOAN':        ['QUAN_LY', 'CHU_DN'],
    'LEAD_TELE':      ['QUAN_LY', 'CHU_DN'],
    'LEAD_SALE':      ['QUAN_LY', 'CHU_DN'],
    'LEAD_CSKH':      ['QUAN_LY', 'CHU_DN'],
    'LEAD_MKT':       ['QUAN_LY', 'CHU_DN'],
    'LEAD_TRUC_PAGE': ['QUAN_LY', 'CHU_DN'],
    'QUAN_LY':        ['CHU_DN', 'QUAN_LY'],
    'CHU_DN':         ['CHU_DN', 'QUAN_LY'],
}


def _leave_approver_roles(role):
    return LEAVE_APPROVER_MAP.get(role, ['QUAN_LY', 'CHU_DN'])


def _can_approve_leave(approver, leave):
    return approver.role in _leave_approver_roles(leave.user.role)


def _can_approve_shift(approver, assignment):
    return approver.role in _leave_approver_roles(assignment.user.role)


DEPARTMENT_GROUPS = {
    'Tele': ['TELE', 'LEAD_TELE'],
    'Sale': ['SALE', 'LEAD_SALE'],
    'CSKH': ['CSKH', 'LEAD_CSKH'],
    'MKT': ['MKT', 'LEAD_MKT'],
    'Trực page': ['TRUC_PAGE', 'LEAD_TRUC_PAGE'],
    'Y tế': ['BS', 'KTV'],
    'Lễ tân': ['LE_TAN'],
    'Kế toán': ['KE_TOAN'],
    'Ban quản lý': ['QUAN_LY', 'CHU_DN'],
}


def _user_department(user):
    for dept, roles in DEPARTMENT_GROUPS.items():
        if user.role in roles:
            return dept
    return None


def _department_roles(dept):
    return DEPARTMENT_GROUPS.get(dept, [])


def _is_hr(user):
    return user.role in FULL_HR_ROLES


# ─── Ca làm việc ──────────────────────────────────────────────────────────────

class ShiftListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/attendance/shifts/  — tất cả ca (mọi nhân viên xem được)
    POST /api/attendance/shifts/  — tạo ca mới (KE_TOAN / QUAN_LY)
    """
    permission_classes = [IsAuthenticated]
    queryset = WorkShift.objects.all()
    serializer_class = WorkShiftSerializer

    def create(self, request, *args, **kwargs):
        if not _is_hr(request.user):
            return Response({'detail': 'Không có quyền tạo ca.'}, status=403)
        return super().create(request, *args, **kwargs)


class ShiftAssignmentListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/attendance/shift-assignments/  — phân ca (KE_TOAN/QUAN_LY xem tất, nhân viên xem của mình)
    POST /api/attendance/shift-assignments/  — phân ca (KE_TOAN / QUAN_LY)
    """
    permission_classes = [IsAuthenticated]
    pagination_class = ShiftAssignmentPagination

    def get_serializer_class(self):
        return ShiftAssignmentCreateSerializer if self.request.method == 'POST' else ShiftAssignmentSerializer

    def get_queryset(self):
        qs = ShiftAssignment.objects.select_related('user', 'shift')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        user = self.request.user
        if user.role not in MANAGEMENT_ROLES:
            if not _is_hr(user):
                own_ids = set(qs.filter(user=user).values_list('id', flat=True))
                approvable_ids = {
                    a.id for a in qs.exclude(user=user)
                    if _can_approve_shift(user, a)
                }
                qs = qs.filter(id__in=own_ids | approvable_ids)
        user_id = self.request.query_params.get('user_id')
        if user_id and _is_hr(self.request.user):
            qs = qs.filter(user_id=user_id)
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)
        return qs.order_by('-date', '-shift__start_time')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def perform_create(self, serializer):
        assignment = serializer.save(user=self.request.user)
        try:
            from apps.chat.notifications import send_notification_to_roles
            send_notification_to_roles(
                _leave_approver_roles(assignment.user.role),
                'shift_pending',
                title=f'Đăng ký ca mới từ {assignment.user.get_full_name() or assignment.user.username}',
                body=f'{assignment.shift} · {assignment.date}',
                data={'shift_assignment_id': assignment.id},
            )
        except Exception:
            pass


# ─── Chấm công ────────────────────────────────────────────────────────────────

def _compute_status(check_in, check_out, shift):
    """Tính trạng thái và số phút muộn/về sớm dựa vào ca làm việc."""
    late_minutes = 0
    early_minutes = 0
    sts = 'on_time'

    if check_in and shift:
        from datetime import datetime, timedelta
        allowed = (
            datetime.combine(datetime.today(), shift.start_time)
            + timedelta(minutes=shift.allowed_late_minutes)
        ).time()
        if check_in > allowed:
            delta = datetime.combine(datetime.today(), check_in) - datetime.combine(datetime.today(), shift.start_time)
            late_minutes = int(delta.total_seconds() // 60)
            sts = 'late'

    if check_out and shift:
        from datetime import datetime
        if check_out < shift.end_time:
            delta = datetime.combine(datetime.today(), shift.end_time) - datetime.combine(datetime.today(), check_out)
            early_minutes = int(delta.total_seconds() // 60)
            sts = 'early'

    return sts, late_minutes, early_minutes


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def today_attendance(request):
    """
    GET /api/attendance/today/
    KE_TOAN/QUAN_LY → tất cả nhân viên hôm nay.
    Nhân viên thường → chỉ của mình.
    """
    today = timezone.now().date()
    qs = AttendanceRecord.objects.filter(date=today).select_related('user')
    if not _is_hr(request.user):
        qs = qs.filter(user=request.user)
    return Response(AttendanceRecordSerializer(qs, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def monthly_attendance(request):
    """
    GET /api/attendance/monthly/?year=2026&month=5&user_id=3
    user_id chỉ HR mới truyền được; nhân viên thường → chỉ xem của mình.
    """
    try:
        year = int(request.query_params.get('year', timezone.now().year))
        month = int(request.query_params.get('month', timezone.now().month))
    except ValueError:
        return Response({'detail': 'year/month không hợp lệ.'}, status=400)

    qs = AttendanceRecord.objects.filter(date__year=year, date__month=month).select_related('user')

    if _is_hr(request.user):
        user_id = request.query_params.get('user_id')
        if user_id:
            qs = qs.filter(user_id=user_id)
    else:
        qs = qs.filter(user=request.user)

    records = AttendanceRecordSerializer(qs, many=True).data
    summary = {
        'year': year,
        'month': month,
        'total_days': qs.count(),
        'on_time': qs.filter(status='on_time').count(),
        'late': qs.filter(status='late').count(),
        'early': qs.filter(status='early').count(),
        'absent': qs.filter(status='absent').count(),
        'leave': qs.filter(status='leave').count(),
        'records': records,
    }
    return Response(summary)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_zkteco(request):
    """
    POST /api/attendance/sync/
    Nhận dữ liệu từ ZKTeco middleware và lưu vào DB.
    Chỉ KE_TOAN / QUAN_LY mới gọi được (hoặc service account).
    Body: {"records": [{"employee_id": "EMP001", "timestamp": "2026-05-29T08:05:00"}]}
    employee_id phải khớp với User.username hoặc User.employee_id nếu có.
    """
    if not _is_hr(request.user):
        return Response({'detail': 'Không có quyền đồng bộ chấm công.'}, status=403)

    s = ZKTecoSyncSerializer(data=request.data)
    if not s.is_valid():
        return Response(s.errors, status=400)

    from datetime import datetime
    results = {'created': 0, 'updated': 0, 'errors': []}

    with transaction.atomic():
        for rec in s.validated_data['records']:
            emp_id = rec['employee_id']
            try:
                ts = datetime.fromisoformat(rec['timestamp'])
            except (ValueError, TypeError):
                results['errors'].append({'employee_id': emp_id, 'error': 'timestamp không hợp lệ'})
                continue

            user = User.objects.filter(username=emp_id, is_active=True).first()
            if not user:
                results['errors'].append({'employee_id': emp_id, 'error': 'Không tìm thấy nhân viên'})
                continue

            date = ts.date()
            time_val = ts.time()

            # Lấy ca của nhân viên hôm đó (nếu có)
            assignment = ShiftAssignment.objects.filter(user=user, date=date).select_related('shift').first()
            shift = assignment.shift if assignment else None

            record, created = AttendanceRecord.objects.get_or_create(
                user=user, date=date,
                defaults={'check_in': time_val, 'status': 'on_time', 'source': 'machine'},
            )
            if created:
                # Lần chấm đầu tiên = check_in
                sts, late_min, _ = _compute_status(time_val, None, shift)
                record.status = sts
                record.late_minutes = late_min
                record.save(update_fields=['status', 'late_minutes'])
                results['created'] += 1
            else:
                # Lần chấm thứ hai trở đi = check_out (nếu sau check_in)
                if record.check_in and time_val > record.check_in:
                    sts, late_min, early_min = _compute_status(record.check_in, time_val, shift)
                    record.check_out = time_val
                    record.status = sts
                    record.late_minutes = late_min
                    record.early_minutes = early_min
                    record.save(update_fields=['check_out', 'status', 'late_minutes', 'early_minutes'])
                    results['updated'] += 1

    return Response(results)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def manual_attendance(request):
    """
    POST /api/attendance/manual/
    KE_TOAN / QUAN_LY nhập tay chấm công cho nhân viên.
    """
    if not _is_hr(request.user):
        return Response({'detail': 'Không có quyền nhập tay chấm công.'}, status=403)

    s = ManualAttendanceSerializer(data=request.data)
    if not s.is_valid():
        return Response(s.errors, status=400)

    d = s.validated_data
    user = User.objects.get(id=d['user_id'])

    record, _ = AttendanceRecord.objects.update_or_create(
        user=user, date=d['date'],
        defaults={
            'check_in': d.get('check_in'),
            'check_out': d.get('check_out'),
            'status': d['status'],
            'source': 'manual',
            'manual_reason': d['manual_reason'],
        },
    )
    return Response(AttendanceRecordSerializer(record).data, status=status.HTTP_200_OK)


# ─── Nghỉ phép ────────────────────────────────────────────────────────────────

class LeaveRequestListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/attendance/leaves/  — nhân viên xem của mình + những đơn mình được duyệt
    POST /api/attendance/leaves/  — nhân viên đăng ký nghỉ phép
    """
    permission_classes = [IsAuthenticated]
    serializer_class = LeaveRequestSerializer

    def get_queryset(self):
        user = self.request.user
        qs = LeaveRequest.objects.select_related('user', 'approved_by')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        # QUAN_LY/CHU_DN see everything; others see own + approvable
        if user.role in MANAGEMENT_ROLES:
            return qs
        own_ids = set(qs.filter(user=user).values_list('id', flat=True))
        approvable_ids = {
            leave.id for leave in qs.exclude(user=user)
            if _can_approve_leave(user, leave)
        }
        return qs.filter(id__in=own_ids | approvable_ids)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def perform_create(self, serializer):
        leave = serializer.save()
        try:
            from apps.chat.notifications import send_notification_to_roles
            send_notification_to_roles(
                _leave_approver_roles(leave.user.role),
                'leave_pending',
                title=f'Đơn nghỉ mới từ {leave.user.get_full_name() or leave.user.username}',
                body=f'{leave.get_leave_type_display()} · {leave.start_date} → {leave.end_date}',
                data={'leave_id': leave.id},
            )
        except Exception:
            pass


def _delete_overlapping_shifts(leave):
    """Xóa các ShiftAssignment trùng khung giờ với đơn nghỉ phép đã duyệt."""
    from datetime import time, timedelta

    try:
        duration = leave.duration_type
        if duration == 'half_morning':
            nghi_start, nghi_end = time(0, 0), time(12, 0)
        elif duration == 'half_afternoon':
            nghi_start, nghi_end = time(12, 0), time(23, 59)
        elif duration == 'hourly':
            if leave.start_time and leave.end_time:
                nghi_start, nghi_end = leave.start_time, leave.end_time
            else:
                nghi_start, nghi_end = time(0, 0), time(23, 59)
        else:
            nghi_start, nghi_end = time(0, 0), time(23, 59)

        current = leave.start_date
        while current <= leave.end_date:
            assignments = ShiftAssignment.objects.filter(user=leave.user, date=current).select_related('shift')
            for a in assignments:
                if a.shift.start_time < nghi_end and a.shift.end_time > nghi_start:
                    a.delete()
            current += timedelta(days=1)
    except Exception:
        pass


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_leave(request, pk):
    """
    POST /api/attendance/leaves/{id}/approve/
    KE_TOAN / QUAN_LY duyệt hoặc từ chối đơn nghỉ phép.
    Body: {"action": "approve" | "reject", "reason": "..."}
    """
    leave = LeaveRequest.objects.filter(pk=pk).select_related('user').first()
    if not leave:
        return Response({'detail': 'Không tìm thấy đơn nghỉ phép.'}, status=404)
    if not _can_approve_leave(request.user, leave):
        return Response({'detail': 'Không có quyền duyệt đơn nghỉ phép này.'}, status=403)
    if leave.status != 'pending':
        return Response({'detail': f'Đơn đã ở trạng thái {leave.get_status_display()}, không thể xử lý lại.'}, status=400)

    s = LeaveApproveSerializer(data=request.data)
    if not s.is_valid():
        return Response(s.errors, status=400)

    with transaction.atomic():
        if s.validated_data['action'] == 'approve':
            leave.status = 'approved'
            _delete_overlapping_shifts(leave)
            leave.approved_by = request.user
            leave.approved_at = timezone.now()
            leave.save()

            # Tạo AttendanceRecord "leave" cho từng ngày trong khoảng
            from datetime import date, timedelta
            duration = leave.duration_type
            if duration == 'hourly' and leave.start_time and leave.end_time:
                duration_note = (
                    f'Nghỉ phép theo giờ '
                    f'{leave.start_time.strftime("%H:%M")}-{leave.end_time.strftime("%H:%M")}'
                )
            elif duration == 'half_morning':
                duration_note = 'Nghỉ phép nửa ngày sáng'
            elif duration == 'half_afternoon':
                duration_note = 'Nghỉ phép nửa ngày chiều'
            else:
                duration_note = f'Nghỉ phép: {leave.get_leave_type_display()}'
            current = leave.start_date
            while current <= leave.end_date:
                AttendanceRecord.objects.get_or_create(
                    user=leave.user, date=current,
                    defaults={'status': 'leave', 'source': 'manual', 'manual_reason': duration_note},
                )
                current += timedelta(days=1)
        else:
            leave.status = 'rejected'
            leave.approved_by = request.user
            leave.approved_at = timezone.now()
            leave.reject_reason = s.validated_data.get('reason', '')
            leave.save()

    # Thông báo cho nhân viên
    try:
        from apps.chat.notifications import send_notification
        if leave.status == 'approved':
            send_notification(
                leave.user, 'general',
                'Đơn nghỉ phép được duyệt',
                body=f'{leave.start_date} ~ {leave.end_date}',
                data={'leave_id': leave.id},
            )
        else:
            send_notification(
                leave.user, 'absence_alert',
                'Đơn nghỉ phép bị từ chối',
                body=s.validated_data.get('reason', ''),
                data={'leave_id': leave.id},
            )
    except Exception:
        pass

    return Response(LeaveRequestSerializer(leave).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_shift(request, pk):
    """
    POST /api/attendance/shift-assignments/{id}/approve/
    Lead/quản lý duyệt hoặc từ chối đơn đăng ký ca.
    Body: {"action": "approve" | "reject", "reason": "..."}
    """
    assignment = ShiftAssignment.objects.filter(pk=pk).select_related('user', 'shift').first()
    if not assignment:
        return Response({'detail': 'Không tìm thấy đơn đăng ký ca.'}, status=404)
    if not _can_approve_shift(request.user, assignment):
        return Response({'detail': 'Không có quyền duyệt đơn đăng ký ca này.'}, status=403)
    if assignment.status != 'pending':
        return Response({'detail': f'Đơn đã ở trạng thái {assignment.get_status_display()}, không thể xử lý lại.'}, status=400)

    s = LeaveApproveSerializer(data=request.data)
    if not s.is_valid():
        return Response(s.errors, status=400)

    with transaction.atomic():
        if s.validated_data['action'] == 'approve':
            assignment.status = 'approved'
            assignment.approved_by = request.user
            assignment.approved_at = timezone.now()
            assignment.save()
        else:
            assignment.status = 'rejected'
            assignment.approved_by = request.user
            assignment.approved_at = timezone.now()
            assignment.reject_reason = s.validated_data.get('reason', '')
            assignment.save()

    # Thông báo cho nhân viên
    try:
        from apps.chat.notifications import send_notification
        if assignment.status == 'approved':
            send_notification(
                assignment.user, 'general',
                'Đăng ký ca được duyệt',
                body=f'{assignment.shift} · {assignment.date}',
                data={'shift_assignment_id': assignment.id},
            )
        else:
            send_notification(
                assignment.user, 'absence_alert',
                'Đăng ký ca bị từ chối',
                body=s.validated_data.get('reason', ''),
                data={'shift_assignment_id': assignment.id},
            )
    except Exception:
        pass

    return Response(ShiftAssignmentSerializer(assignment).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def department_week_shifts(request):
    """
    GET /api/attendance/shift-assignments/department-week/?week_start=YYYY-MM-DD&department=...
    Trả lịch ca làm việc của một phòng trong 7 ngày kể từ week_start.
    QUAN_LY/CHU_DN có thể truyền department để xem phòng khác; còn lại chỉ xem phòng của mình.
    """
    from datetime import datetime, timedelta

    week_start_str = request.query_params.get('week_start')
    if not week_start_str:
        return Response({'detail': 'week_start không hợp lệ'}, status=400)
    try:
        week_start = datetime.strptime(week_start_str, '%Y-%m-%d').date()
    except ValueError:
        return Response({'detail': 'week_start không hợp lệ'}, status=400)
    week_end = week_start + timedelta(days=6)

    department = request.query_params.get('department')
    if request.user.role in MANAGEMENT_ROLES and department:
        if department not in DEPARTMENT_GROUPS:
            return Response({'detail': 'department không hợp lệ'}, status=400)
        dept = department
    else:
        dept = _user_department(request.user)
        if dept is None:
            return Response({'department': None, 'week_start': str(week_start), 'assignments': []})

    roles = _department_roles(dept)
    qs = ShiftAssignment.objects.filter(
        user__role__in=roles, date__gte=week_start, date__lte=week_end,
    ).select_related('user', 'shift', 'approved_by')

    serializer = ShiftAssignmentSerializer(qs, many=True, context={'request': request})
    return Response({'department': dept, 'week_start': str(week_start), 'assignments': serializer.data})
