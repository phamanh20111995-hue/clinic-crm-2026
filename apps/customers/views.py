from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
import django_filters

from .models import Customer, CustomerImage, CallHistory, ReturnRequest
from .serializers import (
    CustomerListSerializer, CustomerDetailSerializer,
    CustomerCreateSerializer, CustomerAssignSerializer,
    CustomerImageSerializer, CallHistorySerializer,
    ReturnRequestSerializer, CustomerCskhAssignSerializer,
)
from .pagination import CustomerPagination
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
    if user.role == 'TRUC_PAGE':
        return qs
    # Vai trò khác không có quyền xem hồ sơ KH
    return qs.none()


class CustomerFilter(django_filters.FilterSet):
    created_after = django_filters.DateFilter(field_name='created_at', lookup_expr='date__gte')
    created_before = django_filters.DateFilter(field_name='created_at', lookup_expr='date__lte')
    unassigned = django_filters.BooleanFilter(method='filter_unassigned')
    services_interest = django_filters.NumberFilter(field_name='services_interest', lookup_expr='exact')
    assigned_to = django_filters.NumberFilter(method='filter_assigned_to')
    unassigned_role = django_filters.CharFilter(method='filter_unassigned_role')

    class Meta:
        model = Customer
        fields = ['source', 'status', 'data_type', 'gender', 'province', 'sale', 'tele', 'cskh', 'is_customer', 'customer_group', 'ads']

    def filter_unassigned(self, queryset, name, value):
        if value:
            return queryset.filter(sale__isnull=True, tele__isnull=True, cskh__isnull=True)
        return queryset

    def filter_assigned_to(self, queryset, name, value):
        from django.db.models import Q
        return queryset.filter(Q(tele_id=value) | Q(sale_id=value) | Q(cskh_id=value) | Q(ads_id=value))

    def filter_unassigned_role(self, queryset, name, value):
        m = {'tele': 'tele__isnull', 'sale': 'sale__isnull', 'cskh': 'cskh__isnull', 'ads': 'ads__isnull'}
        if value in m:
            return queryset.filter(**{m[value]: True})
        return queryset


class CustomerListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/customers/        — Danh sách KH (filter theo role tự động)
    POST /api/customers/        — Tạo KH mới
    """
    permission_classes = [IsAuthenticated]
    pagination_class = CustomerPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = CustomerFilter
    search_fields = ['full_name', 'phone']
    ordering = ['-created_at']
    ordering_fields = ['full_name', 'phone', 'created_at', 'status', 'source']

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
        return _customer_queryset(self.request.user)


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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def page_stats(request):
    """GET /api/customers/page-stats/ - So tong cho StatCard (tinh tren toan queryset, khong phan trang)."""
    from django.db.models import Sum, Count, Q, DecimalField
    from django.db.models.functions import Coalesce
    from django.utils import timezone

    qs = _customer_queryset(request.user)
    qs = CustomerFilter(request.GET, queryset=qs).qs

    today = timezone.localdate()

    total = qs.count()
    dat_lich = qs.filter(appointment_date__isnull=False).count()
    nong_today = qs.filter(data_type='nong', created_at__date=today).count()

    zero = Coalesce(Sum('contracts__final_amount', filter=Q(contracts__sale_round='sale')), 0, output_field=DecimalField())
    paid = Coalesce(
        Sum('contracts__cash_amount', filter=Q(contracts__sale_round='sale')), 0, output_field=DecimalField()
    ) + Coalesce(
        Sum('contracts__transfer_amount', filter=Q(contracts__sale_round='sale')), 0, output_field=DecimalField()
    )
    agg = qs.aggregate(round1_value=zero, round1_paid=paid)
    r1_value = float(agg['round1_value'] or 0)
    r1_paid = float(agg['round1_paid'] or 0)
    r1_debt = r1_value - r1_paid

    return Response({
        'total': total,
        'dat_lich': dat_lich,
        'nong_today': nong_today,
        'round1_value': r1_value,
        'round1_paid': r1_paid,
        'round1_debt': r1_debt,
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cskh_stats(request):
    """GET /api/customers/cskh-stats/ - 4 the nhac viec cho man CSKH."""
    from django.utils import timezone
    from apps.appointments.models import Appointment

    user = request.user
    today = timezone.localdate()

    qs = _customer_queryset(user).filter(is_customer=True)
    if user.role == 'CSKH':
        qs = qs.filter(cskh=user)

    total = qs.count()

    appts = Appointment.objects.filter(customer__in=qs)
    cham_soc_today = appts.filter(scheduled_at__date=today).count()
    nhac_lich_today = appts.filter(scheduled_at__date__gt=today).count()
    tai_kham_due = appts.filter(visit_type='tai_kham', scheduled_at__date__lte=today).count()

    # TODO: sap_het_lieu_trinh can field dem buoi tren Contract; cho_danh_gia can model danh gia
    sap_het_lt = 0
    cho_danh_gia = 0

    return Response({
        'total': total,
        'cham_soc_today': cham_soc_today,
        'nhac_lich_today': nhac_lich_today,
        'tai_kham_due': tai_kham_due,
        'sap_het_lt': sap_het_lt,
        'cho_danh_gia': cho_danh_gia,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sale_stats(request):
    from django.utils import timezone
    from django.db.models import Sum
    from django.db.models.functions import Coalesce
    from django.db.models import DecimalField, Value
    from apps.contracts.models import Contract

    user = request.user
    today = timezone.localdate()

    qs = _customer_queryset(user).filter(is_customer=True)
    total = qs.count()

    approved_qs = Contract.objects.filter(
        created_by=user,
        approval_status='approved',
        is_deleted=False,
    )

    chot_today = approved_qs.filter(approved_at__date=today).count()

    hd_pending = Contract.objects.filter(
        created_by=user,
        approval_status__in=['draft', 'pending_kt'],
        is_deleted=False,
    ).count()

    month_qs = approved_qs.filter(
        approved_at__year=today.year,
        approved_at__month=today.month,
    )

    agg = month_qs.aggregate(
        revenue=Coalesce(Sum('final_amount'),    Value(0), output_field=DecimalField()),
        paid_ck=Coalesce(Sum('transfer_amount'), Value(0), output_field=DecimalField()),
        paid_tm=Coalesce(Sum('cash_amount'),     Value(0), output_field=DecimalField()),
    )

    revenue_month = float(agg['revenue'])
    paid          = float(agg['paid_ck'] + agg['paid_tm'])
    debt          = revenue_month - paid

    return Response({
        'total':         total,
        'chot_today':    chot_today,
        'hd_pending':    hd_pending,
        'revenue_month': revenue_month,
        'paid':          paid,
        'debt':          debt,
    })
