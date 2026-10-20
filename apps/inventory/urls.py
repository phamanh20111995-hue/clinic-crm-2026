from django.urls import path
from .views import (
    ProductListCreateView, ProductDetailView, SupplierListCreateView,
    StockEntryListCreateView, SupplierPaymentListCreateView, StockMovementListView,
)

urlpatterns = [
    path('products/', ProductListCreateView.as_view()),
    path('products/<int:pk>/', ProductDetailView.as_view()),
    path('suppliers/', SupplierListCreateView.as_view()),
    path('stock-entries/', StockEntryListCreateView.as_view()),
    path('supplier-payments/', SupplierPaymentListCreateView.as_view()),
    path('movements/', StockMovementListView.as_view()),
]
