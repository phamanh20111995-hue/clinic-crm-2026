from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction
from django.contrib.auth import get_user_model

from .models import WorkShift, ShiftAssignment, AttendanceRecord, LeaveRequest
from .serializers import (
    WorkShiftSerializer, ShiftAssignmentSerializer, ShiftAssignmentCreateSerializer,
    AttendanceRecordSerializer, ManualAttendanceSerializer, ZKTecoSyncSerializer,
    LeaveRequestSerializer, LeaveApproveSerializer,
)

User = get_user_model()

MANAGEMENT_ROLES = frozenset(['QUAN_LY', 'CHU_DN'])
FULL_HR_ROLES = frozenset(['QUAN_LY', 'CHU_DN', 'KE_TOAN'])


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

    def get_serializer_class(self):
        return ShiftAssignmentCreateSerializer if self.request.method == 'POST' else ShiftAssignmentSerializer

    def get_queryset(self):
        qs = ShiftAssignment.objects.select_related('user', 'shift')
        if not _is_hr(self.request.user):
            qs = qs.filter(user=self.request.user)
        user_id = self.request.query_params.get('user_id')
        if user_id and _is_hr(self.request.user):
            qs = qs.filter(user_id=user_id)
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)
        return qs

    def create(self, request, *args, **kwargs):
        if not _is_hr(request.user):
            return Response({'detail': 'Không có quyền phân ca.'}, status=403)
        return super().create(request, *args, **kwargs)


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
    GET  /api/attendance/leaves/  — nhân viên xem của mình, HR xem tất cả
    POST /api/attendance/leaves/  — nhân viên đăng ký nghỉ phép
    """
    permission_classes = [IsAuthenticated]
    serializer_class = LeaveRequestSerializer

    def get_queryset(self):
        qs = LeaveRequest.objects.select_related('user', 'approved_by')
        if not _is_hr(self.request.user):
            qs = qs.filter(user=self.request.user)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_leave(request, pk):
    """
    POST /api/attendance/leaves/{id}/approve/
    KE_TOAN / QUAN_LY duyệt hoặc từ chối đơn nghỉ phép.
    Body: {"action": "approve" | "reject", "reason": "..."}
    """
    if not _is_hr(request.user):
        return Response({'detail': 'Không có quyền duyệt nghỉ phép.'}, status=403)

    leave = LeaveRequest.objects.filter(pk=pk).select_related('user').first()
    if not leave:
        return Response({'detail': 'Không tìm thấy đơn nghỉ phép.'}, status=404)
    if leave.status != 'pending':
        return Response({'detail': f'Đơn đã ở trạng thái {leave.get_status_display()}, không thể xử lý lại.'}, status=400)

    s = LeaveApproveSerializer(data=request.data)
    if not s.is_valid():
        return Response(s.errors, status=400)

    with transaction.atomic():
        if s.validated_data['action'] == 'approve':
            leave.status = 'approved'
            leave.approved_by = request.user
            leave.approved_at = timezone.now()
            leave.save()

            # Tạo AttendanceRecord "leave" cho từng ngày trong khoảng
            from datetime import date, timedelta
            current = leave.start_date
            while current <= leave.end_date:
                AttendanceRecord.objects.get_or_create(
                    user=leave.user, date=current,
                    defaults={'status': 'leave', 'source': 'manual',
                              'manual_reason': f'Nghỉ phép: {leave.get_leave_type_display()}'},
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
