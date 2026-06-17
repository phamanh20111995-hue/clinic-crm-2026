from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction

from .models import Appointment
from .serializers import (
    AppointmentListSerializer, AppointmentCreateSerializer,
    AppointmentUpdateSerializer, WalkInSerializer, AssignRoomSerializer,
)
from apps.accounts.models import FULL_ACCESS_ROLES
from apps.accounts.permissions import IsLeTan
from apps.chat.notifications import send_notification, send_notification_to_roles

LETAN_ROLES = ('LE_TAN', 'QUAN_LY', 'CHU_DN')


def _appointment_queryset(user):
    """
    RBAC filter:
    - LE_TAN / FULL_ACCESS_ROLES → tất cả
    - SALE      → appointment KH của mình
    - CSKH      → appointment KH của mình
    - doctor/ktv → appointment được assign cho mình
    - TELE      → chỉ đọc, xem tất cả
    """
    qs = Appointment.objects.select_related(
        'customer', 'service', 'room', 'booked_by', 'doctor', 'ktv', 'sale'
    )
    if user.role in FULL_ACCESS_ROLES or user.role == 'TELE':
        return qs
    if user.role == 'SALE':
        return qs.filter(customer__sale=user)
    if user.role == 'CSKH':
        return qs.filter(customer__sale=user) | qs.filter(ktv=user)
    return qs.filter(doctor=user) | qs.filter(ktv=user)


class AppointmentListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/appointments/  — Danh sách (filter theo role)
    POST /api/appointments/  — Tạo lịch hẹn mới
    Query: date (YYYY-MM-DD), status, customer_id, room_id
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return AppointmentCreateSerializer if self.request.method == 'POST' else AppointmentListSerializer

    def get_queryset(self):
        qs = _appointment_queryset(self.request.user)
        p = self.request.query_params
        if p.get('date'):
            qs = qs.filter(scheduled_at__date=p['date'])
        if p.get('status'):
            qs = qs.filter(status=p['status'])
        if p.get('customer_id'):
            qs = qs.filter(customer_id=p['customer_id'])
        if p.get('room_id'):
            qs = qs.filter(room_id=p['room_id'])
        return qs.order_by('scheduled_at')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def today_appointments(request):
    """GET /api/appointments/today/ — Lịch hẹn hôm nay."""
    today = timezone.localdate()
    qs = _appointment_queryset(request.user).filter(
        scheduled_at__date=today
    ).exclude(status='cancelled').order_by('scheduled_at')

    status_filter = request.query_params.get('status')
    if status_filter:
        qs = qs.filter(status=status_filter)

    return Response({
        'date': str(today),
        'count': qs.count(),
        'results': AppointmentListSerializer(qs, many=True).data,
    })


class AppointmentDetailView(generics.RetrieveUpdateAPIView):
    """GET/PUT/PATCH /api/appointments/{id}/"""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _appointment_queryset(self.request.user)

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return AppointmentUpdateSerializer
        return AppointmentListSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def checkin_view(request, pk):
    """
    POST /api/appointments/{id}/checkin/
    Lễ tân check-in KH đến → status = 'confirmed'.
    """
    if request.user.role not in LETAN_ROLES:
        return Response({'detail': 'Chỉ Lễ tân mới check-in được.'}, status=403)

    appt = Appointment.objects.filter(pk=pk).select_related('customer').first()
    if not appt:
        return Response({'detail': 'Không tìm thấy lịch hẹn.'}, status=404)
    if appt.status not in ('pending', 'confirmed'):
        return Response({'detail': f'Không thể check-in khi trạng thái là {appt.get_status_display()}.'}, status=400)

    with transaction.atomic():
        appt.status = 'confirmed'
        appt.notes = (appt.notes + f'\n[Check-in {timezone.now():%H:%M %d/%m/%Y} bởi {request.user.display_name}]').strip()
        appt.save()
        appt.customer.status = 'dat_lich'
        appt.customer.save(update_fields=['status', 'updated_at'])

    send_notification_to_roles(
        ['QUAN_LY', 'CHU_DN', 'LEAD_CSKH'],
        'kh_checkin',
        f'KH {appt.customer.full_name} vừa check-in',
        body=f'Lịch hẹn #{appt.id} — {appt.scheduled_at:%H:%M %d/%m/%Y}',
        data={'appointment_id': appt.id, 'customer_id': appt.customer_id},
    )
    return Response(AppointmentListSerializer(appt).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enqueue(request, pk):
    """
    POST /api/appointments/{id}/enqueue/
    Lễ tân chọn loại lượt và đưa KH vào hàng chờ.
    Chỉ gọi được khi status='confirmed'.
    Body: { visit_type: 'tu_van' | 'dieu_tri' | 'tai_kham' | 'khieu_nai' }
    → dieu_tri  : status='waiting_treat'
    → còn lại   : status='waiting_consult'
    """
    if request.user.role not in LETAN_ROLES:
        return Response({'detail': 'Chỉ Lễ tân mới thực hiện được.'}, status=403)

    appt = Appointment.objects.filter(pk=pk).select_related('customer').first()
    if not appt:
        return Response({'detail': 'Không tìm thấy lịch hẹn.'}, status=404)
    if appt.status != 'confirmed':
        return Response({'detail': 'Khách chưa xác nhận đến.'}, status=400)

    visit_type = request.data.get('visit_type')
    valid_types = [c[0] for c in Appointment.VISIT_TYPE_CHOICES]
    if not visit_type or visit_type not in valid_types:
        return Response({'detail': f'visit_type không hợp lệ. Chọn một trong: {valid_types}'}, status=400)

    appt.visit_type = visit_type
    appt.status = 'waiting_treat' if visit_type == 'dieu_tri' else 'waiting_consult'
    appt.save(update_fields=['visit_type', 'status'])

    return Response(AppointmentListSerializer(appt).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def to_treatment(request, pk):
    """
    POST /api/appointments/{id}/to-treatment/
    Sale/Lễ tân chốt liệu trình, chuyển KH từ tư vấn sang chờ điều trị.
    Chỉ gọi được khi status='consulting'.
    → visit_type='dieu_tri', status='waiting_treat', room=None (giải phóng phòng tư vấn).
    """
    allowed = ('SALE', 'LEAD_SALE') + LETAN_ROLES
    if request.user.role not in allowed:
        return Response({'detail': 'Không có quyền thực hiện.'}, status=403)

    appt = Appointment.objects.filter(pk=pk).first()
    if not appt:
        return Response({'detail': 'Không tìm thấy lịch hẹn.'}, status=404)
    if appt.status != 'consulting':
        return Response({'detail': 'Chỉ chuyển điều trị khi đang tư vấn.'}, status=400)

    appt.visit_type = 'dieu_tri'
    appt.status     = 'waiting_treat'
    appt.room       = None   # giải phóng phòng tư vấn
    appt.save(update_fields=['visit_type', 'status', 'room'])

    return Response(AppointmentListSerializer(appt).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_tua(request, pk):
    """
    POST /api/appointments/{id}/confirm-tua/
    Xác nhận tua sau điều trị.
    Body: {"via_zalo": true/false}
    """
    if request.user.role not in ('LE_TAN', 'QUAN_LY', 'CHU_DN', 'CSKH', 'LEAD_CSKH'):
        return Response({'detail': 'Không có quyền xác nhận tua.'}, status=403)

    appt = Appointment.objects.filter(pk=pk).first()
    if not appt:
        return Response({'detail': 'Không tìm thấy lịch hẹn.'}, status=404)
    if appt.status not in ('in_progress', 'done'):
        return Response({'detail': 'Chỉ xác nhận tua khi đang/đã điều trị.'}, status=400)

    via_zalo = request.data.get('via_zalo', False)
    appt.tua_confirmed          = True
    appt.tua_confirmed_via_zalo = via_zalo
    appt.status = 'done'
    appt.save()

    return Response(AppointmentListSerializer(appt).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assign_room(request, pk):
    """
    POST /api/appointments/{id}/assign-room/
    Lễ tân phân phòng: ghi room, doctor, ktv, sale, visit_type.
    Chỉ cho phân khi KH đang trong hàng chờ (waiting_consult / waiting_treat).
    Status tự động: dieu_tri → in_progress; còn lại → consulting.
    """
    if request.user.role not in LETAN_ROLES:
        return Response({'detail': 'Chỉ Lễ tân mới phân phòng được.'}, status=403)

    appt = Appointment.objects.select_related(
        'customer', 'service', 'room', 'booked_by', 'doctor', 'ktv', 'sale'
    ).filter(pk=pk).first()
    if not appt:
        return Response({'detail': 'Không tìm thấy lịch hẹn.'}, status=404)
    if appt.status not in ('waiting_consult', 'waiting_treat'):
        return Response({'detail': 'Khách chưa ở hàng chờ. Chỉ phân phòng khi trạng thái là "Chờ tư vấn" hoặc "Chờ điều trị".'}, status=400)

    s = AssignRoomSerializer(appt, data=request.data, partial=True)
    s.is_valid(raise_exception=True)
    s.save()
    appt.refresh_from_db()

    notif_data = {'appointment_id': appt.id, 'customer_id': appt.customer_id}
    notif_title = f'Bạn được phân khám KH {appt.customer.full_name}'
    try:
        if appt.doctor:
            send_notification(appt.doctor, 'room_assigned', notif_title, data=notif_data)
        if appt.ktv:
            send_notification(appt.ktv, 'room_assigned', notif_title, data=notif_data)
        if appt.sale:
            send_notification(appt.sale, 'room_assigned', notif_title, data=notif_data)
            send_notification_to_roles(['LEAD_SALE'], 'room_assigned', notif_title, data=notif_data)
        if appt.doctor or appt.ktv:
            send_notification_to_roles(['QUAN_LY', 'CHU_DN'], 'room_assigned', notif_title, data=notif_data)
    except Exception:
        pass

    return Response(AppointmentListSerializer(appt).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def checkout(request, pk):
    """
    POST /api/appointments/{id}/checkout/
    KH về: set status='done', checked_out_at=now(), room=None (giải phóng phòng).
    Chỉ gọi được khi status in ('consulting', 'in_progress').
    """
    if request.user.role not in LETAN_ROLES:
        return Response({'detail': 'Chỉ Lễ tân mới cho KH về được.'}, status=403)

    appt = Appointment.objects.filter(pk=pk).select_related('customer').first()
    if not appt:
        return Response({'detail': 'Không tìm thấy lịch hẹn.'}, status=404)
    if appt.status not in ('consulting', 'in_progress'):
        return Response({'detail': f'Không thể cho về khi trạng thái là {appt.get_status_display()}.'}, status=400)

    now = timezone.now()
    appt.status         = 'done'
    appt.checked_out_at = now
    appt.room           = None   # giải phóng phòng
    appt.notes = (appt.notes + f'\n[Khách về {now:%H:%M %d/%m/%Y} — ghi bởi {request.user.display_name}]').strip()
    appt.save(update_fields=['status', 'checked_out_at', 'room', 'notes'])

    return Response(AppointmentListSerializer(appt).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def walkin_create(request):
    """
    POST /api/appointments/walkin/
    Lễ tân tạo KH walk-in + lịch hẹn cùng lúc.
    """
    if request.user.role not in LETAN_ROLES:
        return Response({'detail': 'Chỉ Lễ tân mới tạo walk-in.'}, status=403)

    s = WalkInSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    data = s.validated_data

    from apps.customers.models import Customer

    with transaction.atomic():
        customer = Customer.objects.filter(phone=data['phone'], is_deleted=False).first()
        created_customer = False
        if not customer:
            customer = Customer.objects.create(
                full_name=data['full_name'],
                phone=data['phone'],
                gender=data.get('gender', ''),
                source='walkin',
                status='dat_lich',
                created_by=request.user,
            )
            created_customer = True
        else:
            customer.status = 'dat_lich'
            customer.save(update_fields=['status', 'updated_at'])

        appt = Appointment.objects.create(
            customer=customer,
            scheduled_at=timezone.now(),
            service=data.get('service'),
            room=data.get('room'),
            notes=data.get('notes', ''),
            booked_by=request.user,
            status='confirmed',
            is_walkin=True,
            visit_type=data.get('visit_type', 'tu_van'),
        )

    return Response({
        'customer_created': created_customer,
        'customer_id': customer.id,
        'customer_name': customer.full_name,
        'customer_phone': customer.phone,
        'appointment': AppointmentListSerializer(appt).data,
    }, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def available_staff(request):
    """
    GET /api/appointments/available-staff/?date=YYYY-MM-DD&role=BS
    Trả danh sách nhân sự có ca duyệt (ShiftAssignment status='approved') theo ngày.
    Chỉ LE_TAN / QUAN_LY / CHU_DN được gọi.
    """
    if request.user.role not in LETAN_ROLES:
        return Response({'detail': 'Không có quyền xem danh sách nhân sự.'}, status=403)

    from apps.attendance.models import ShiftAssignment
    from django.contrib.auth import get_user_model
    User = get_user_model()

    date_str = request.query_params.get('date')
    if date_str:
        try:
            from datetime import date as date_type
            query_date = date_type.fromisoformat(date_str)
        except ValueError:
            return Response({'detail': 'date không hợp lệ, dùng định dạng YYYY-MM-DD.'}, status=400)
    else:
        query_date = timezone.localdate()

    qs = ShiftAssignment.objects.filter(date=query_date, status='approved')
    role_filter = request.query_params.get('role')
    if role_filter:
        qs = qs.filter(user__role=role_filter)

    user_ids = qs.values_list('user_id', flat=True).distinct()
    users = User.objects.filter(id__in=user_ids, is_active=True).values('id', 'first_name', 'email', 'role')

    return Response({'date': str(query_date), 'results': list(users)})
