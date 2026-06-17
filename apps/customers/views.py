from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone

from .models import Customer, CustomerImage, CallHistory, ReturnRequest
from .serializers import (
    CustomerListSerializer, CustomerDetailSerializer,
    CustomerCreateSerializer, CustomerAssignSerializer,
    CustomerImageSerializer, CallHistorySerializer,
    ReturnRequestSerializer, CustomerCskhAssignSerializer,
)
from apps.accounts.permissions import IsLeadTele, IsLeadOrAbove, HasFullCustomerAccess
from apps.chat.notifications import send_notification, send_notification_to_roles


def _customer_queryset(user, detail=False):
    """
    RBAC filter theo CLAUDE.md:
    - FULL_ACCESS_ROLES → tất cả KH chưa xoá
    - SALE → chỉ KH do mình phụ trách
    - TELE → KH được assign (hàng chờ)
    """
    from apps.accounts.models import FULL_ACCESS_ROLES
    qs = Customer.objects.filter(is_deleted=False)
    if detail:
        qs = qs.select_related('tele','sale','cskh','created_by').prefetch_related('calls','images')
    else:
        qs = qs.select_related('tele','sale','cskh')

    if user.role in FULL_ACCESS_ROLES:
        return qs
    if user.role == 'SALE':
        return qs.filter(sale=user)
    if user.role == 'TELE':
        return qs.filter(tele=user)
    if user.role == 'CSKH':
        return qs.filter(cskh=user)
    if user.role == 'LEAD_CSKH':
        return qs
    # Vai trò khác không có quyền xem hồ sơ KH
    return qs.none()


class CustomerListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/customers/        — Danh sách KH (filter theo role tự động)
    POST /api/customers/        — Tạo KH mới
    Query params: status, source, data_type, tele_id, sale_id, search
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return CustomerCreateSerializer if self.request.method == 'POST' else CustomerListSerializer

    def perform_create(self, serializer):
        customer = serializer.save()
        try:
            if self.request.user.role == 'TRUC_PAGE':
                send_notification_to_roles(
                    ['LEAD_TELE'], 'new_lead_from_page',
                    f'KH mới từ Trực page: {customer.full_name}',
                    data={'customer_id': customer.id},
                )
        except Exception:
            pass

    def get_queryset(self):
        qs = _customer_queryset(self.request.user)
        p = self.request.query_params

        if p.get('status'):   qs = qs.filter(status=p['status'])
        if p.get('source'):   qs = qs.filter(source=p['source'])
        if p.get('data_type'):qs = qs.filter(data_type=p['data_type'])
        if p.get('tele_id'):  qs = qs.filter(tele_id=p['tele_id'])
        if p.get('sale_id'):  qs = qs.filter(sale_id=p['sale_id'])
        if p.get('search'):
            qs = qs.filter(full_name__icontains=p['search']) | qs.filter(phone__icontains=p['search'])
        return qs.order_by('-created_at')


class CustomerDetailView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/customers/{id}/  — Chi tiết KH
    PATCH /api/customers/{id}/  — Cập nhật
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _customer_queryset(self.request.user, detail=True)

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return CustomerCreateSerializer
        return CustomerDetailSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_phone(request):
    """GET /api/customers/check-phone/?phone= — Kiểm tra trùng SĐT."""
    phone = request.query_params.get('phone', '').strip()
    if not phone:
        return Response({'detail': 'Thiếu tham số phone.'}, status=400)
    existing = Customer.objects.filter(phone=phone, is_deleted=False).first()
    if existing:
        return Response({
            'exists': True,
            'customer': {'id': existing.id, 'full_name': existing.full_name,
                         'phone': existing.phone, 'status': existing.status,
                         'status_display': existing.get_status_display()}
        })
    return Response({'exists': False})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assign_customer(request, pk):
    """POST /api/customers/{id}/assign/ — Phân công Tele/Sale (Lead+)."""
    if request.user.role not in ('LEAD_TELE','LEAD_SALE','QUAN_LY','CHU_DN'):
        return Response({'detail': 'Không có quyền phân công.'}, status=403)
    customer = Customer.objects.filter(pk=pk, is_deleted=False).first()
    if not customer:
        return Response({'detail': 'Không tìm thấy KH.'}, status=404)
    s = CustomerAssignSerializer(customer, data=request.data, partial=True)
    s.is_valid(raise_exception=True)
    s.save()
    customer.refresh_from_db()
    try:
        notif_data = {'customer_id': customer.id}
        notif_title = f'Bạn được giao KH {customer.full_name}'
        if customer.tele:
            send_notification(customer.tele, 'customer_assigned', notif_title, data=notif_data)
        if customer.sale:
            send_notification(customer.sale, 'customer_assigned', notif_title, data=notif_data)
    except Exception:
        pass
    return Response(s.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assign_cskh(request, pk):
    """POST /api/customers/{id}/assign-cskh/ — Phân công CSKH (Lead CSKH+)."""
    if request.user.role not in ('LEAD_CSKH', 'QUAN_LY', 'CHU_DN'):
        return Response({'detail': 'Không có quyền phân công CSKH.'}, status=403)
    customer = Customer.objects.filter(pk=pk, is_deleted=False).first()
    if not customer:
        return Response({'detail': 'Không tìm thấy KH.'}, status=404)
    s = CustomerCskhAssignSerializer(customer, data=request.data, partial=True)
    s.is_valid(raise_exception=True)
    s.save()
    customer.refresh_from_db()
    if customer.cskh_id and customer.status == 'cho_phan_cskh':
        customer.status = 'dang_cham_soc'
        customer.save(update_fields=['status', 'updated_at'])
    try:
        if customer.cskh:
            send_notification(
                customer.cskh, 'cskh_assigned',
                f'Bạn được giao chăm sóc KH {customer.full_name}',
                data={'customer_id': customer.id},
            )
    except Exception:
        pass
    return Response(CustomerDetailSerializer(customer).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_image(request, pk):
    """POST /api/customers/{id}/images/ — Upload ảnh KH."""
    customer = _customer_queryset(request.user).filter(pk=pk).first()
    if not customer:
        return Response({'detail': 'Không tìm thấy KH.'}, status=404)
    s = CustomerImageSerializer(data=request.data)
    if s.is_valid():
        s.save(customer=customer, uploaded_by=request.user)
        return Response(s.data, status=201)
    return Response(s.errors, status=400)
