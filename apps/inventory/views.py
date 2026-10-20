from rest_framework import generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Supplier, Product, StockEntry, StockMovement, SupplierPayment
from .serializers import (
    SupplierSerializer, ProductSerializer, StockEntrySerializer,
    StockEntryCreateSerializer, StockMovementSerializer, SupplierPaymentSerializer,
)

# Nhap kho / xem gia von / quan ly SP: KE_TOAN + QUAN_LY + CHU_DN
INVENTORY_ROLES = {'KE_TOAN', 'QUAN_LY', 'CHU_DN'}


def _can_manage(user):
    return getattr(user, 'role', None) in INVENTORY_ROLES


class ProductListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Product.objects.filter(is_deleted=False)
        p = self.request.query_params
        if p.get('category'):
            qs = qs.filter(category=p['category'])
        if p.get('search'):
            qs = qs.filter(name__icontains=p['search'])
        if p.get('low_stock') == '1':
            ids = [x.id for x in qs if x.stock <= x.min_stock]
            qs = qs.filter(id__in=ids)
        return qs.order_by('-created_at')

    def create(self, request, *args, **kwargs):
        if not _can_manage(request.user):
            return Response({'detail': 'Không có quyền thêm sản phẩm.'}, status=403)
        return super().create(request, *args, **kwargs)


class ProductDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    queryset = Product.objects.filter(is_deleted=False)

    def update(self, request, *args, **kwargs):
        if not _can_manage(request.user):
            return Response({'detail': 'Không có quyền sửa sản phẩm.'}, status=403)
        return super().update(request, *args, **kwargs)


class SupplierListCreateView(generics.ListCreateAPIView):
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]
    queryset = Supplier.objects.filter(is_active=True).order_by('name')


class StockEntryListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return StockEntryCreateSerializer if self.request.method == 'POST' else StockEntrySerializer

    def get_queryset(self):
        return (StockEntry.objects.filter(is_deleted=False)
                .select_related('supplier').prefetch_related('lines').order_by('-created_at'))

    def create(self, request, *args, **kwargs):
        if not _can_manage(request.user):
            return Response({'detail': 'Không có quyền nhập kho.'}, status=403)
        return super().create(request, *args, **kwargs)


class SupplierPaymentListCreateView(generics.ListCreateAPIView):
    serializer_class = SupplierPaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = SupplierPayment.objects.select_related('supplier')
        supplier_id = self.request.query_params.get('supplier')
        if supplier_id:
            qs = qs.filter(supplier_id=supplier_id)
        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def create(self, request, *args, **kwargs):
        if not _can_manage(request.user):
            return Response({'detail': 'Không có quyền.'}, status=403)
        return super().create(request, *args, **kwargs)


class StockMovementListView(generics.ListAPIView):
    serializer_class = StockMovementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = StockMovement.objects.select_related('product')
        product_id = self.request.query_params.get('product')
        if product_id:
            qs = qs.filter(product_id=product_id)
        return qs.order_by('-created_at')
