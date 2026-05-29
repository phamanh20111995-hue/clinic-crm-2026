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


def _appointment_queryset(user):
    """
    RBAC filter:
    - LE_TAN / FULL_ACCESS_ROLES → tất cả
    - SALE      → appointment KH của mình
    - CSKH      → appointment KH của mình
    - doctor/ktv → appointment được assign cho mình (role không cố định)
    - TELE      → chỉ đọc, xem tất cả (nhận thông báo walk-in)
    """
    qs = Appointment.objects.select_related(
        'customer', 'service', 'room', 'booked_by', 'doctor', 'ktv'
    )
    if user.role in FULL_ACCESS_ROLES or user.role == 'TELE':
        return qs
    if user.role == 'SALE':
        return qs.filter(customer__sale=user)
    if user.role == 'CSKH':
        return qs.filter(customer__sale=user) | qs.filter(ktv=user)
    # BS/KTV (không có role cố định — dùng assignment)
    return qs.filter(doctor=user) | qs.filter(ktv=user)


class AppointmentListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/appointments/         — Danh sách (filter theo role)
    POST /api/appointments/         — Tạo lịch hẹn mới
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
    Lễ tân check-in KH đến. → status = 'confirmed', ghi nhận thời gian.
    Cập nhật customer.status = 'dat_lich' (đã đến).
    """
    if request.user.role not in ('LE_TAN', 'QUAN_LY', 'CHU_DN'):
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
        # Cập nhật trạng thái KH
        appt.customer.status = 'dat_lich'
        appt.customer.save(update_fields=['status', 'updated_at'])

    return Response(AppointmentListSerializer(appt).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_tua(request, pk):
    """
    POST /api/appointments/{id}/confirm-tua/
    Xác nhận tua sau điều trị. Lễ tân hoặc BS/KTV xác nhận.
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
    appt.tua_confirmed = True
    appt.tua_confirmed_via_zalo = via_zalo
    appt.status = 'done'
    appt.save()

    return Response(AppointmentListSerializer(appt).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assign_room(request, pk):
    """
    POST /api/appointments/{id}/assign-room/
    Lễ tân phân phòng điều trị.
    """
    if request.user.role not in ('LE_TAN', 'QUAN_LY', 'CHU_DN'):
        return Response({'detail': 'Chỉ Lễ tân mới phân phòng được.'}, status=403)

    appt = Appointment.objects.filter(pk=pk).first()
    if not appt:
        return Response({'detail': 'Không tìm thấy lịch hẹn.'}, status=404)

    s = AssignRoomSerializer(appt, data=request.data, partial=True)
    s.is_valid(raise_exception=True)
    s.save()
    return Response(AppointmentListSerializer(appt).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def walkin_create(request):
    """
    POST /api/appointments/walkin/
    Lễ tân tạo KH walk-in + lịch hẹn cùng lúc.
    Trước tiên kiểm tra phone — nếu đã có KH thì chỉ tạo appointment.
    """
    if request.user.role not in ('LE_TAN', 'QUAN_LY', 'CHU_DN'):
        return Response({'detail': 'Chỉ Lễ tân mới tạo walk-in.'}, status=403)

    s = WalkInSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    data = s.validated_data

    from apps.customers.models import Customer

    with transaction.atomic():
        # Kiểm tra KH có sẵn theo SĐT
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
            # KH cũ đến walk-in — cập nhật trạng thái
            customer.status = 'dat_lich'
            customer.save(update_fields=['status', 'updated_at'])

        # Tạo appointment ngay tại thời điểm hiện tại
        appt = Appointment.objects.create(
            customer=customer,
            scheduled_at=timezone.now(),
            service=data.get('service'),
            room=data.get('room'),
            notes=data.get('notes', ''),
            booked_by=request.user,
            status='confirmed',   # Walk-in → đã xác nhận luôn
            is_walkin=True,
        )

    return Response({
        'customer_created': created_customer,
        'customer_id': customer.id,
        'customer_name': customer.full_name,
        'customer_phone': customer.phone,
        'appointment': AppointmentListSerializer(appt).data,
    }, status=201)
