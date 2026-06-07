from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction

from .models import Contract
from .serializers import (
    ContractListSerializer, ContractDetailSerializer,
    ContractCreateSerializer, ContractUpdateSerializer,
)
from apps.accounts.models import MANAGEMENT_ROLES
from apps.accounts.permissions import IsKeToan
from apps.chat.notifications import send_notification, send_notification_to_roles


def _contract_queryset(user):
    """
    RBAC:
    - QUAN_LY / CHU_DN      → tất cả
    - KE_TOAN               → tất cả (cần duyệt)
    - LEAD_SALE             → tất cả của team Sale
    - SALE                  → HĐ do mình tạo
    - CSKH / LEAD_CSKH      → HĐ KH của mình
    """
    qs = Contract.objects.filter(is_deleted=False).select_related(
        'customer', 'created_by', 'approved_by', 'appointment'
    )
    if user.role in MANAGEMENT_ROLES or user.role in ('KE_TOAN', 'LEAD_SALE'):
        return qs
    if user.role == 'SALE':
        return qs.filter(created_by=user)
    if user.role in ('CSKH', 'LEAD_CSKH'):
        return qs.filter(customer__sale__isnull=False) | qs.filter(customer__tele=user)
    return qs.none()


class ContractListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/contracts/      — Danh sách HĐ (filter theo role)
    POST /api/contracts/      — Tạo HĐ nháp (SALE / CSKH / Management)
    Query: approval_status, customer_id, payment_status
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return ContractCreateSerializer if self.request.method == 'POST' else ContractListSerializer

    def get_queryset(self):
        qs = _contract_queryset(self.request.user)
        p = self.request.query_params
        if p.get('approval_status'): qs = qs.filter(approval_status=p['approval_status'])
        if p.get('payment_status'):  qs = qs.filter(payment_status=p['payment_status'])
        if p.get('customer_id'):     qs = qs.filter(customer_id=p['customer_id'])
        return qs.order_by('-created_at')

    def create(self, request, *args, **kwargs):
        allowed = {'SALE', 'CSKH', 'LEAD_SALE', 'LEAD_CSKH'} | MANAGEMENT_ROLES
        if request.user.role not in allowed:
            return Response({'detail': 'Không có quyền tạo hợp đồng.'}, status=403)
        return super().create(request, *args, **kwargs)


class ContractDetailView(generics.RetrieveUpdateAPIView):
    """GET / PATCH /api/contracts/{id}/"""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _contract_queryset(self.request.user)

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return ContractUpdateSerializer
        return ContractDetailSerializer

    def update(self, request, *args, **kwargs):
        contract = self.get_object()
        if contract.approval_status != 'draft':
            return Response({'detail': 'Chỉ cập nhật được HĐ ở trạng thái Nháp.'}, status=400)
        return super().update(request, *args, **kwargs)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_contract(request, pk):
    """
    POST /api/contracts/{id}/submit/
    Sale/CSKH submit HĐ lên KT duyệt.
    draft → pending_kt
    """
    allowed = {'SALE', 'CSKH', 'LEAD_SALE', 'LEAD_CSKH'} | MANAGEMENT_ROLES
    if request.user.role not in allowed:
        return Response({'detail': 'Không có quyền submit.'}, status=403)

    contract = _contract_queryset(request.user).filter(pk=pk).first()
    if not contract:
        return Response({'detail': 'Không tìm thấy HĐ.'}, status=404)
    if contract.approval_status != 'draft':
        return Response({'detail': f'HĐ đang ở trạng thái {contract.get_approval_status_display()}, không thể submit.'}, status=400)

    contract.approval_status = 'pending_kt'
    contract.save(update_fields=['approval_status'])

    # Cập nhật customer status
    contract.customer.status = 'dat_lich'
    contract.customer.save(update_fields=['status', 'updated_at'])

    send_notification_to_roles(
        ['KE_TOAN'],
        'hd_pending_kt',
        f'HĐ {contract.contract_no} cần duyệt',
        body=f'KH: {contract.customer.full_name} — {contract.final_amount:,.0f} VNĐ',
        data={'contract_id': contract.id},
    )
    return Response(ContractDetailSerializer(contract).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_contract(request, pk):
    """
    POST /api/contracts/{id}/approve/
    KT duyệt HĐ → pending_kt → approved.
    Ghi nhận approved_by, approved_at.
    """
    if request.user.role not in ('KE_TOAN',) | MANAGEMENT_ROLES:
        return Response({'detail': 'Chỉ Kế toán mới duyệt HĐ.'}, status=403)

    contract = Contract.objects.filter(pk=pk, is_deleted=False).first()
    if not contract:
        return Response({'detail': 'Không tìm thấy HĐ.'}, status=404)
    if contract.approval_status != 'pending_kt':
        return Response({'detail': 'HĐ chưa được submit hoặc đã xử lý.'}, status=400)

    with transaction.atomic():
        contract.approval_status = 'approved'
        contract.approved_by = request.user
        contract.approved_at = timezone.now()
        # Nếu KH đã thanh toán khi tạo HĐ → ghi nhận
        if contract.final_amount > 0:
            contract.payment_status = 'received'
        contract.save()

        # Chuyển KH vào hàng chờ CSKH hoặc đang chăm sóc nếu đã phân CSKH
        customer = contract.customer
        if customer.cskh_id:
            customer.status = 'dang_cham_soc'
        else:
            customer.status = 'cho_phan_cskh'
        customer.save(update_fields=['status', 'updated_at'])

    send_notification(
        contract.created_by,
        'hd_approved',
        f'HĐ {contract.contract_no} đã được duyệt',
        body=f'KH: {contract.customer.full_name}',
        data={'contract_id': contract.id},
    )
    return Response(ContractDetailSerializer(contract).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_contract(request, pk):
    """
    POST /api/contracts/{id}/reject/
    KT từ chối HĐ. Body: {"reason": "..."}
    pending_kt → rejected
    """
    if request.user.role not in ('KE_TOAN',) | MANAGEMENT_ROLES:
        return Response({'detail': 'Chỉ Kế toán mới từ chối HĐ.'}, status=403)

    contract = Contract.objects.filter(pk=pk, is_deleted=False).first()
    if not contract:
        return Response({'detail': 'Không tìm thấy HĐ.'}, status=404)
    if contract.approval_status != 'pending_kt':
        return Response({'detail': 'HĐ chưa được submit hoặc đã xử lý.'}, status=400)

    reason = request.data.get('reason', '').strip()
    if not reason:
        return Response({'detail': 'Vui lòng nhập lý do từ chối.'}, status=400)

    contract.approval_status = 'rejected'
    contract.approved_by = request.user
    contract.approved_at = timezone.now()
    contract.notes = (contract.notes + f'\n[Từ chối: {reason}]').strip()
    contract.save()

    send_notification(
        contract.created_by,
        'hd_rejected',
        f'HĐ {contract.contract_no} bị từ chối',
        body=reason,
        data={'contract_id': contract.id},
    )
    return Response(ContractDetailSerializer(contract).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_contract(request, pk):
    """
    POST /api/contracts/{id}/delete/
    Soft delete — chỉ xóa được HĐ draft. CLAUDE.md: không xóa cứng.
    """
    contract = _contract_queryset(request.user).filter(pk=pk).first()
    if not contract:
        return Response({'detail': 'Không tìm thấy HĐ.'}, status=404)
    if contract.approval_status != 'draft':
        return Response({'detail': 'Chỉ xóa được HĐ ở trạng thái Nháp.'}, status=400)
    contract.is_deleted = True
    contract.save(update_fields=['is_deleted'])
    return Response({'detail': 'Đã xóa HĐ nháp.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_contracts(request):
    """
    GET /api/contracts/pending/
    KT xem danh sách HĐ chờ duyệt — realtime dashboard.
    """
    if request.user.role not in ('KE_TOAN',) | MANAGEMENT_ROLES:
        return Response({'detail': 'Không có quyền.'}, status=403)

    qs = Contract.objects.filter(
        is_deleted=False, approval_status='pending_kt'
    ).select_related('customer', 'created_by').order_by('created_at')

    return Response({
        'count': qs.count(),
        'results': ContractListSerializer(qs, many=True).data,
    })
