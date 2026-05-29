"""
/api/calls/* — Luồng Tele theo CLAUDE.md:
  Hàng chờ → Ghi KQ → Hoàn số → Lead Tele duyệt
"""
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction

from .models import Customer, CallHistory, ReturnRequest
from .serializers import CallHistorySerializer, ReturnRequestSerializer
from apps.accounts.permissions import IsLeadTele


class TeleQueueView(generics.ListAPIView):
    """
    GET /api/calls/queue/
    Hàng chờ Tele: KH được assign cho mình, chưa đặt lịch.
    Lead Tele thấy toàn bộ hàng chờ của team.
    Sort: data_type (nóng trước), created_at asc.
    """
    serializer_class = None  # dùng inline
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .serializers import CustomerListSerializer
        user = request.user
        if user.role not in ('TELE', 'LEAD_TELE', 'QUAN_LY', 'CHU_DN'):
            return Response({'detail': 'Chỉ Tele mới xem hàng chờ.'}, status=403)

        qs = Customer.objects.filter(
            is_deleted=False,
            status__in=['chua_goi', 'khong_nghe', 'hen_goi', 'da_goi', 'can_tv'],
        ).select_related('tele', 'sale')

        if user.role == 'TELE':
            qs = qs.filter(tele=user)
        # Lead Tele / Management thấy tất cả

        # Filter thêm
        p = request.query_params
        if p.get('data_type'): qs = qs.filter(data_type=p['data_type'])
        if p.get('tele_id'):   qs = qs.filter(tele_id=p['tele_id'])
        if p.get('status'):    qs = qs.filter(status=p['status'])

        # Sort: nóng trước, sau đó cũ nhất lên đầu
        DATA_ORDER = {'nong': 0, 'am': 1, 'thuong': 2}
        qs = qs.order_by('created_at')
        results = sorted(qs, key=lambda c: DATA_ORDER.get(c.data_type, 99))

        from django.core.paginator import Paginator
        page_size = int(p.get('page_size', 20))
        page_num = int(p.get('page', 1))
        paginator = Paginator(results, page_size)
        page = paginator.get_page(page_num)
        return Response({
            'count': paginator.count,
            'total_pages': paginator.num_pages,
            'results': CustomerListSerializer(page.object_list, many=True).data
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def log_call(request):
    """
    POST /api/calls/
    Tele ghi KQ gọi. Tự tăng call_count, cập nhật customer.status.
    Nếu result='dat_lich' → trả về flag để FE tạo lịch hẹn.
    """
    user = request.user
    if user.role not in ('TELE', 'LEAD_TELE', 'QUAN_LY', 'CHU_DN'):
        return Response({'detail': 'Chỉ Tele mới ghi cuộc gọi.'}, status=403)

    customer_id = request.data.get('customer_id')
    if not customer_id:
        return Response({'detail': 'Thiếu customer_id.'}, status=400)

    customer = Customer.objects.filter(pk=customer_id, is_deleted=False).first()
    if not customer:
        return Response({'detail': 'Không tìm thấy KH.'}, status=404)

    # Tele chỉ ghi KQ cho KH được assign
    if user.role == 'TELE' and customer.tele_id != user.id:
        return Response({'detail': 'KH này không thuộc hàng chờ của bạn.'}, status=403)

    with transaction.atomic():
        customer.call_count += 1
        result = request.data.get('result', '')
        customer.status = result
        customer.save(update_fields=['call_count', 'status', 'updated_at'])

        call = CallHistory.objects.create(
            customer=customer,
            tele=user,
            call_number=customer.call_count,
            result=result,
            consult_result=request.data.get('consult_result', ''),
            notes=request.data.get('notes', ''),
        )

    response_data = CallHistorySerializer(call).data
    if result == 'dat_lich':
        response_data['suggest_appointment'] = True
    return Response(response_data, status=201)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_return_request(request):
    """
    POST /api/calls/return-request/
    Tele tạo yêu cầu hoàn số kèm file ghi âm.
    """
    user = request.user
    if user.role not in ('TELE', 'LEAD_TELE', 'QUAN_LY', 'CHU_DN'):
        return Response({'detail': 'Không có quyền.'}, status=403)

    customer_id = request.data.get('customer_id')
    customer = Customer.objects.filter(pk=customer_id, is_deleted=False).first()
    if not customer:
        return Response({'detail': 'Không tìm thấy KH.'}, status=404)

    s = ReturnRequestSerializer(data=request.data)
    if s.is_valid():
        rr = s.save(customer=customer, requested_by=user)
        customer.status = 'hoan_so'
        customer.save(update_fields=['status', 'updated_at'])
        return Response(ReturnRequestSerializer(rr).data, status=201)
    return Response(s.errors, status=400)


class ReturnRequestListView(generics.ListAPIView):
    """GET /api/calls/return-requests/ — Lead Tele xem danh sách chờ duyệt."""
    serializer_class = ReturnRequestSerializer
    permission_classes = [IsAuthenticated, IsLeadTele]

    def get_queryset(self):
        qs = ReturnRequest.objects.select_related('customer', 'requested_by', 'reviewed_by')
        status_filter = self.request.query_params.get('status', 'pending')
        return qs.filter(status=status_filter)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def review_return_request(request, pk):
    """
    POST /api/calls/return-request/{id}/approve/
    Lead Tele duyệt hoặc từ chối hoàn số.
    Nếu approved → customer.status = 'sai_so', trả về pool Trực page.
    """
    if request.user.role not in ('LEAD_TELE', 'QUAN_LY', 'CHU_DN'):
        return Response({'detail': 'Chỉ Lead Tele mới duyệt.'}, status=403)

    rr = ReturnRequest.objects.filter(pk=pk, status='pending').first()
    if not rr:
        return Response({'detail': 'Không tìm thấy hoặc đã xử lý.'}, status=404)

    action = request.data.get('action')  # 'approve' | 'reject'
    if action not in ('approve', 'reject'):
        return Response({'detail': 'action phải là approve hoặc reject.'}, status=400)

    with transaction.atomic():
        rr.status = 'approved' if action == 'approve' else 'rejected'
        rr.reviewed_by = request.user
        rr.reviewed_at = timezone.now()
        rr.save()

        if action == 'approve':
            # Trả data về pool Trực page
            rr.customer.status = 'sai_so'
            rr.customer.tele = None
            rr.customer.save(update_fields=['status', 'tele', 'updated_at'])

    return Response(ReturnRequestSerializer(rr).data)
