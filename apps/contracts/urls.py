from django.urls import path
from . import views

urlpatterns = [
    path('', views.ContractListCreateView.as_view(), name='contract-list-create'),
    path('pending/', views.pending_contracts, name='contract-pending'),
    path('<int:pk>/', views.ContractDetailView.as_view(), name='contract-detail'),
    path('<int:pk>/submit/', views.submit_contract, name='contract-submit'),
    path('<int:pk>/approve/', views.approve_contract, name='contract-approve'),
    path('<int:pk>/reject/', views.reject_contract, name='contract-reject'),
    path('<int:pk>/delete/', views.delete_contract, name='contract-delete'),
]
