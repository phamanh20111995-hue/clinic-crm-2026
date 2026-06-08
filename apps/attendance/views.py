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


def _is_hr(user):
    return user.role in FULL_HR_ROLES


# â”€â”€â”€ Ca lÃ m viá»‡c â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class ShiftListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/attendance/shifts/  â€” táº¥t cáº£ ca (má»i nhÃ¢n viÃªn xem Ä‘Æ°á»£c)
    POST /api/attendance/shifts/  â€” táº¡o ca má»›i (KE_TOAN / QUAN_LY)
    """
    permission_classes = [IsAuthenticated]
    queryset = WorkShift.objects.all()
    serializer_class = WorkShiftSerializer

    def create(self, request, *args, **kwargs):
        if not _is_hr(request.user):
            return Response({'detail': 'KhÃ´ng cÃ³ quyá»n táº¡o ca.'}, status=403)
        return super().create(request, *args, **kwargs)


class ShiftAssignmentListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/attendance/shift-assignments/  â€” phÃ¢n ca (KE_TOAN/QUAN_LY xem táº¥t, nhÃ¢n viÃªn xem cá»§a mÃ¬nh)
    POST /api/attendance/shift-assignments/  â€” phÃ¢n ca (KE_TOAN / QUAN_LY)
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
            return Response({'detail': 'KhÃ´ng cÃ³ quyá»n phÃ¢n ca.'}, status=403)
        return super().create(request, *args, **kwargs)


# â”€â”€â”€ Cháº¥m cÃ´ng â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _compute_status(check_in, check_out, shift):
    """TÃ­nh tráº¡ng thÃ¡i vÃ  sá»‘ phÃºt muá»™n/vá» sá»›m dá»±a vÃ o ca lÃ m viá»‡c."""
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
    KE_TOAN/QUAN_LY â†’ táº¥t cáº£ nhÃ¢n viÃªn hÃ´m nay.
    NhÃ¢n viÃªn thÆ°á»ng â†’ chá»‰ cá»§a mÃ¬nh.
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
    user_id chá»‰ HR má»›i truyá»n Ä‘Æ°á»£c; nhÃ¢n viÃªn thÆ°á»ng â†’ chá»‰ xem cá»§a mÃ¬nh.
    """
    try:
        year = int(request.query_params.get('year', timezone.now().year))
        month = int(request.query_params.get('month', timezone.now().month))
    except ValueError:
        return Response({'detail': 'year/month khÃ´ng há»£p lá»‡.'}, status=400)

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
    Nháº­n dá»¯ liá»‡u tá»« ZKTeco middleware vÃ  lÆ°u vÃ o DB.
    Chá»‰ KE_TOAN / QUAN_LY má»›i gá»i Ä‘Æ°á»£c (hoáº·c service account).
    Body: {"records": [{"employee_id": "EMP001", "timestamp": "2026-05-29T08:05:00"}]}
    employee_id pháº£i khá»›p vá»›i User.username hoáº·c User.employee_id náº¿u cÃ³.
    """
    if not _is_hr(request.user):
        return Response({'detail': 'KhÃ´ng cÃ³ quyá»n Ä‘á»“ng bá»™ cháº¥m cÃ´ng.'}, status=403)

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
                results['errors'].append({'employee_id': emp_id, 'error': 'timestamp khÃ´ng há»£p lá»‡'})
                continue

            user = User.objects.filter(username=emp_id, is_active=True).first()
            if not user:
                results['errors'].append({'employee_id': emp_id, 'error': 'KhÃ´ng tÃ¬m tháº¥y nhÃ¢n viÃªn'})
                continue

            date = ts.date()
            time_val = ts.time()

            # Láº¥y ca cá»§a nhÃ¢n viÃªn hÃ´m Ä‘Ã³ (náº¿u cÃ³)
            assignment = ShiftAssignment.objects.filter(user=user, date=date).select_related('shift').first()
            shift = assignment.shift if assignment else None

            record, created = AttendanceRecord.objects.get_or_create(
                user=user, date=date,
                defaults={'check_in': time_val, 'status': 'on_time', 'source': 'machine'},
            )
            if created:
                # Láº§n cháº¥m Ä‘áº§u tiÃªn = check_in
                sts, late_min, _ = _compute_status(time_val, None, shift)
                record.status = sts
                record.late_minutes = late_min
                record.save(update_fields=['status', 'late_minutes'])
                results['created'] += 1
            else:
                # Láº§n cháº¥m thá»© hai trá»Ÿ Ä‘i = check_out (náº¿u sau check_in)
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
    KE_TOAN / QUAN_LY nháº­p tay cháº¥m cÃ´ng cho nhÃ¢n viÃªn.
    """
    if not _is_hr(request.user):
        return Response({'detail': 'KhÃ´ng cÃ³ quyá»n nháº­p tay cháº¥m cÃ´ng.'}, status=403)

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


# â”€â”€â”€ Nghá»‰ phÃ©p â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class LeaveRequestListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/attendance/leaves/  â€” nhÃ¢n viÃªn xem cá»§a mÃ¬nh + nhá»¯ng Ä‘Æ¡n mÃ¬nh Ä‘Æ°á»£c duyá»‡t
    POST /api/attendance/leaves/  â€” nhÃ¢n viÃªn Ä‘Äƒng kÃ½ nghá»‰ phÃ©p
    """
    permission_classes = [IsAuthenticated]
    serializer_class = LeaveRequestSerializer

    def get_queryset(self):
        user = self.request.user
        qs = LeaveRequest.objects.select_related('user', 'approved_by')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        # QUAN_LY/CHU_DN xem tat ca don
        if user.role in MANAGEMENT_ROLES:
            return qs
        # Collect PKs visible to this user:
        # own leaves + leaves of staff whose approver role includes this user's role
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
                title=f'ÄÆ¡n nghá»‰ má»›i tá»« {leave.user.get_full_name() or leave.user.username}',
                body=f'{leave.get_leave_type_display()} Â· {leave.start_date} â†’ {leave.end_date}',
                data={'leave_id': leave.id},
            )
        except Exception:
            pass


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_leave(request, pk):
    """
    POST /api/attendance/leaves/{id}/approve/
    KE_TOAN / QUAN_LY duyá»‡t hoáº·c tá»« chá»‘i Ä‘Æ¡n nghá»‰ phÃ©p.
    Body: {"action": "approve" | "reject", "reason": "..."}
    """
    leave = LeaveRequest.objects.filter(pk=pk).select_related('user').first()
    if not leave:
        return Response({'detail': 'KhÃ´ng tÃ¬m tháº¥y Ä‘Æ¡n nghá»‰ phÃ©p.'}, status=404)
    if not _can_approve_leave(request.user, leave):
        return Response({'detail': 'KhÃ´ng cÃ³ quyá»n duyá»‡t Ä‘Æ¡n nghá»‰ phÃ©p nÃ y.'}, status=403)
    if leave.status != 'pending':
        return Response({'detail': f'ÄÆ¡n Ä‘Ã£ á»Ÿ tráº¡ng thÃ¡i {leave.get_status_display()}, khÃ´ng thá»ƒ xá»­ lÃ½ láº¡i.'}, status=400)

    s = LeaveApproveSerializer(data=request.data)
    if not s.is_valid():
        return Response(s.errors, status=400)

    with transaction.atomic():
        if s.validated_data['action'] == 'approve':
            leave.status = 'approved'
            leave.approved_by = request.user
            leave.approved_at = timezone.now()
            leave.save()

            # Táº¡o AttendanceRecord "leave" cho tá»«ng ngÃ y trong khoáº£ng
            from datetime import date, timedelta
            duration = leave.duration_type
            if duration == 'hourly' and leave.start_time and leave.end_time:
                duration_note = (
                    f'Nghá»‰ phÃ©p theo giá» '
                    f'{leave.start_time.strftime("%H:%M")}-{leave.end_time.strftime("%H:%M")}'
                )
            elif duration == 'half_morning':
                duration_note = 'Nghá»‰ phÃ©p ná»­a ngÃ y sÃ¡ng'
            elif duration == 'half_afternoon':
                duration_note = 'Nghá»‰ phÃ©p ná»­a ngÃ y chiá»u'
            else:
                duration_note = f'Nghá»‰ phÃ©p: {leave.get_leave_type_display()}'
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

    # ThÃ´ng bÃ¡o cho nhÃ¢n viÃªn
    try:
        from apps.chat.notifications import send_notification
        if leave.status == 'approved':
            send_notification(
                leave.user, 'general',
                'ÄÆ¡n nghá»‰ phÃ©p Ä‘Æ°á»£c duyá»‡t',
                body=f'{leave.start_date} ~ {leave.end_date}',
                data={'leave_id': leave.id},
            )
        else:
            send_notification(
                leave.user, 'absence_alert',
                'ÄÆ¡n nghá»‰ phÃ©p bá»‹ tá»« chá»‘i',
                body=s.validated_data.get('reason', ''),
                data={'leave_id': leave.id},
            )
    except Exception:
        pass

    return Response(LeaveRequestSerializer(leave).data)

