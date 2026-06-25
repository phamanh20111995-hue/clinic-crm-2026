from decimal import Decimal
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .models import KPITarget, KPIRecord
from .serializers import KPIRecordSerializer, KPITargetSerializer

FULL_ACCESS = frozenset(['QUAN_LY', 'CHU_DN', 'KE_TOAN', 'LEAD_SALE', 'LEAD_TELE', 'LEAD_CSKH'])


def _get_period(request):
    try:
        year = int(request.query_params.get('year', timezone.now().year))
        month = int(request.query_params.get('month', timezone.now().month))
    except ValueError:
        return None, None, Response({'detail': 'year/month không hợp lệ.'}, status=400)
    return year, month, None


def _compute_kpi(user, month, year):
    """Tính KPI thực tế từ DB và lưu vào KPIRecord. Returns instance."""
    from apps.customers.models import Customer
    from apps.customers.models import CallHistory
    from apps.appointments.models import Appointment
    from apps.contracts.models import Contract

    # Lấy target
    target = KPITarget.objects.filter(user=user, month=month, year=year).first()

    # Calls (Tele)
    calls_actual = CallHistory.objects.filter(
        customer__tele=user,
        called_at__year=year, called_at__month=month,
    ).count()

    # Appointments (Sale / CSKH — lịch hẹn của KH mình phụ trách)
    appointments_actual = Appointment.objects.filter(
        customer__sale=user,
        scheduled_at__year=year, scheduled_at__month=month,
    ).exclude(status='cancelled').count()

    # Revenue & Contracts (Sale — HĐ approved)
    contracts_qs = Contract.objects.filter(
        created_by=user, approval_status='approved',
        approved_at__year=year, approved_at__month=month,
        is_deleted=False,
    )
    contracts_actual = contracts_qs.count()
    revenue_actual = Decimal(str(sum(c.final_amount for c in contracts_qs)))

    # Tua count (KTV)
    tua_count = Appointment.objects.filter(
        ktv=user, tua_confirmed=True,
        scheduled_at__year=year, scheduled_at__month=month,
    ).count()

    # Achievement rate: trung bình các chỉ số có target
    rates = []
    if target:
        if target.calls_target:
            rates.append(calls_actual / target.calls_target * 100)
        if target.appointments_target:
            rates.append(appointments_actual / target.appointments_target * 100)
        if target.revenue_target:
            rates.append(float(revenue_actual) / float(target.revenue_target) * 100)
        if target.contracts_target:
            rates.append(contracts_actual / target.contracts_target * 100)
    achievement_rate = Decimal(str(round(sum(rates) / len(rates), 2))) if rates else Decimal('0')

    record, _ = KPIRecord.objects.update_or_create(
        user=user, month=month, year=year,
        defaults={
            'calls_target': target.calls_target if target else 0,
            'calls_actual': calls_actual,
            'appointments_target': target.appointments_target if target else 0,
            'appointments_actual': appointments_actual,
            'revenue_target': target.revenue_target if target else 0,
            'revenue_actual': revenue_actual,
            'contracts_target': target.contracts_target if target else 0,
            'contracts_actual': contracts_actual,
            'tua_count': tua_count,
            'achievement_rate': achievement_rate,
        },
    )
    return record


# ─── Dashboard tổng hợp ───────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def kpi_dashboard(request):
    """
    GET /api/kpi/dashboard/?year=2026&month=5
    CHU_DN / QUAN_LY / KE_TOAN → tất cả nhân viên.
    Lead → nhân viên trong team (same role group).
    Nhân viên thường → chỉ của mình.
    """
    year, month, err = _get_period(request)
    if err:
        return err

    from django.contrib.auth import get_user_model
    User = get_user_model()

    user = request.user
    if user.role in ('QUAN_LY', 'CHU_DN', 'KE_TOAN'):
        users = User.objects.filter(is_active=True)
    elif user.role == 'LEAD_SALE':
        users = User.objects.filter(role__in=['SALE', 'LEAD_SALE'], is_active=True)
    elif user.role == 'LEAD_TELE':
        users = User.objects.filter(role__in=['TELE', 'LEAD_TELE'], is_active=True)
    elif user.role == 'LEAD_CSKH':
        users = User.objects.filter(role__in=['CSKH', 'LEAD_CSKH'], is_active=True)
    else:
        users = User.objects.filter(pk=user.pk)

    records = [_compute_kpi(u, month, year) for u in users]

    # Tổng hợp funnel cho toàn phòng khám
    from apps.customers.models import Customer
    from apps.appointments.models import Appointment
    from apps.contracts.models import Contract

    new_customers = Customer.objects.filter(
        created_at__year=year, created_at__month=month, is_deleted=False,
    ).count()
    appointments_done = Appointment.objects.filter(
        scheduled_at__year=year, scheduled_at__month=month,
    ).exclude(status='cancelled').count()
    contracts_approved = Contract.objects.filter(
        approved_at__year=year, approved_at__month=month,
        approval_status='approved', is_deleted=False,
    ).count()
    total_revenue = sum(
        float(c.final_amount) for c in Contract.objects.filter(
            approved_at__year=year, approved_at__month=month,
            approval_status='approved', is_deleted=False,
        )
    )

    return Response({
        'year': year, 'month': month,
        'funnel': {
            'new_customers': new_customers,
            'appointments_done': appointments_done,
            'contracts_approved': contracts_approved,
            'total_revenue': total_revenue,
            'conversion_rate': round(contracts_approved / new_customers * 100, 1) if new_customers else 0,
        },
        'staff': KPIRecordSerializer(records, many=True).data,
    })


# ─── KPI Tele ─────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def kpi_tele(request):
    """
    GET /api/kpi/tele/?year=2026&month=5
    Thống kê Tele: số cuộc gọi, KH tiếp cận, tỷ lệ chuyển lịch hẹn.
    """
    year, month, err = _get_period(request)
    if err:
        return err

    from django.contrib.auth import get_user_model
    from apps.customers.models import CallHistory, Customer
    from apps.appointments.models import Appointment
    User = get_user_model()

    user = request.user
    if user.role in ('QUAN_LY', 'CHU_DN', 'KE_TOAN', 'LEAD_TELE'):
        tele_users = User.objects.filter(role__in=['TELE', 'LEAD_TELE'], is_active=True)
    else:
        tele_users = User.objects.filter(pk=user.pk)

    result = []
    for u in tele_users:
        calls = CallHistory.objects.filter(
            customer__tele=u,
            called_at__year=year, called_at__month=month,
        )
        total_calls = calls.count()
        unique_customers = calls.values('customer').distinct().count()

        appointments = Appointment.objects.filter(
            customer__tele=u,
            scheduled_at__year=year, scheduled_at__month=month,
        ).exclude(status='cancelled').count()

        result.append({
            'user_id': u.id,
            'user_name': u.get_full_name() or u.email,
            'total_calls': total_calls,
            'unique_customers_called': unique_customers,
            'appointments_booked': appointments,
            'conversion_rate': round(appointments / unique_customers * 100, 1) if unique_customers else 0,
            'kpi': KPIRecordSerializer(_compute_kpi(u, month, year)).data,
        })

    return Response({'year': year, 'month': month, 'tele': result})


# ─── KPI Sale ─────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def kpi_sale(request):
    """
    GET /api/kpi/sale/?year=2026&month=5
    Thống kê Sale: doanh thu, số HĐ, tỷ lệ chốt.
    """
    year, month, err = _get_period(request)
    if err:
        return err

    from django.contrib.auth import get_user_model
    from apps.contracts.models import Contract
    from apps.customers.models import Customer
    User = get_user_model()

    user = request.user
    if user.role in ('QUAN_LY', 'CHU_DN', 'KE_TOAN', 'LEAD_SALE'):
        sale_users = User.objects.filter(role__in=['SALE', 'LEAD_SALE'], is_active=True)
    else:
        sale_users = User.objects.filter(pk=user.pk)

    result = []
    for u in sale_users:
        contracts_qs = Contract.objects.filter(
            created_by=u, approval_status='approved',
            approved_at__year=year, approved_at__month=month,
            is_deleted=False,
        )
        contracts_count = contracts_qs.count()
        revenue = sum(float(c.final_amount) for c in contracts_qs)

        # Số KH được assign cho sale này trong tháng
        customers_assigned = Customer.objects.filter(
            sale=u, is_deleted=False,
            created_at__year=year, created_at__month=month,
        ).count()

        # HĐ draft/pending trong kỳ
        pipeline = Contract.objects.filter(
            created_by=u,
            approval_status__in=['draft', 'pending_kt'],
            is_deleted=False,
        ).count()

        result.append({
            'user_id': u.id,
            'user_name': u.get_full_name() or u.email,
            'customers_assigned': customers_assigned,
            'contracts_approved': contracts_count,
            'revenue': revenue,
            'pipeline': pipeline,
            'close_rate': round(contracts_count / customers_assigned * 100, 1) if customers_assigned else 0,
            'kpi': KPIRecordSerializer(_compute_kpi(u, month, year)).data,
        })

    return Response({'year': year, 'month': month, 'sale': result})


# ─── KPI Trực page + phễu ─────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def kpi_truc_page(request):
    """
    GET /api/kpi/truc-page/?year=2026&month=5
    Funnel: Lead vào → Tele gọi → Lịch hẹn → Khám → HĐ.
    Chỉ QUAN_LY / CHU_DN / LEAD_SALE xem được.
    """
    if request.user.role not in ('QUAN_LY', 'CHU_DN', 'KE_TOAN', 'LEAD_SALE'):
        return Response({'detail': 'Không có quyền xem KPI trực page.'}, status=403)

    year, month, err = _get_period(request)
    if err:
        return err

    from apps.customers.models import Customer, CallHistory
    from apps.appointments.models import Appointment
    from apps.contracts.models import Contract

    # Phễu
    new_leads = Customer.objects.filter(
        created_at__year=year, created_at__month=month,
        is_deleted=False,
    ).count()

    leads_called = CallHistory.objects.filter(
        called_at__year=year, called_at__month=month,
    ).values('customer').distinct().count()

    appointments_created = Appointment.objects.filter(
        created_at__year=year, created_at__month=month,
    ).count()

    appointments_done = Appointment.objects.filter(
        scheduled_at__year=year, scheduled_at__month=month,
        status__in=['confirmed', 'done'],
    ).count()

    contracts_approved = Contract.objects.filter(
        approved_at__year=year, approved_at__month=month,
        approval_status='approved', is_deleted=False,
    ).count()

    total_revenue = sum(
        float(c.final_amount) for c in Contract.objects.filter(
            approved_at__year=year, approved_at__month=month,
            approval_status='approved', is_deleted=False,
        )
    )

    # Nguồn KH
    from django.db.models import Count
    sources = (
        Customer.objects.filter(
            created_at__year=year, created_at__month=month, is_deleted=False,
        )
        .values('source')
        .annotate(count=Count('id'))
        .order_by('-count')
    )

    return Response({
        'year': year, 'month': month,
        'funnel': {
            'new_leads': new_leads,
            'leads_called': leads_called,
            'appointments_created': appointments_created,
            'appointments_done': appointments_done,
            'contracts_approved': contracts_approved,
            'total_revenue': total_revenue,
        },
        'conversion': {
            'lead_to_call': round(leads_called / new_leads * 100, 1) if new_leads else 0,
            'call_to_appointment': round(appointments_created / leads_called * 100, 1) if leads_called else 0,
            'appointment_to_done': round(appointments_done / appointments_created * 100, 1) if appointments_created else 0,
            'done_to_contract': round(contracts_approved / appointments_done * 100, 1) if appointments_done else 0,
            'overall': round(contracts_approved / new_leads * 100, 1) if new_leads else 0,
        },
        'sources': list(sources),
    })


# ─── KPI Targets CRUD ─────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def kpi_targets(request):
    """
    GET  /api/kpi/targets/?year=&month= — xem mục tiêu
    POST /api/kpi/targets/              — HR thiết lập mục tiêu
    """
    if request.method == 'GET':
        year, month, err = _get_period(request)
        if err:
            return err
        qs = KPITarget.objects.filter(year=year, month=month).select_related('user')
        if request.user.role not in FULL_ACCESS:
            qs = qs.filter(user=request.user)
        return Response(KPITargetSerializer(qs, many=True).data)

    # POST
    if request.user.role not in ('QUAN_LY', 'CHU_DN', 'KE_TOAN', 'LEAD_SALE', 'LEAD_TELE', 'LEAD_CSKH'):
        return Response({'detail': 'Không có quyền thiết lập KPI target.'}, status=403)

    from django.contrib.auth import get_user_model
    User = get_user_model()
    data = request.data
    user_id = data.get('user')
    user = User.objects.filter(pk=user_id).first()
    if not user:
        return Response({'detail': 'Nhân viên không tồn tại.'}, status=404)

    target, _ = KPITarget.objects.update_or_create(
        user=user,
        month=data.get('month', timezone.now().month),
        year=data.get('year', timezone.now().year),
        defaults={
            'calls_target': data.get('calls_target', 0),
            'appointments_target': data.get('appointments_target', 0),
            'revenue_target': data.get('revenue_target', 0),
            'contracts_target': data.get('contracts_target', 0),
        },
    )
    return Response(KPITargetSerializer(target).data, status=201)
