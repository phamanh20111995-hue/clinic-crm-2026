from django.urls import path
from . import views
from . import payment_api

urlpatterns = [
    path('', views.ContractListCreateView.as_view(), name='contract-list-create'),
    path('pending/', views.pending_contracts, name='contract-pending'),
    path('cong-no/', payment_api.cong_no_list, name='contract-cong-no'),
    path('installments/', payment_api.installment_list, name='installment-list'),
    path('installments/confirm-batch/', payment_api.confirm_installments_batch, name='installment-confirm-batch'),
    path('installments/<int:pk>/confirm/', payment_api.confirm_installment, name='installment-confirm'),
    path('payments/pending/', payment_api.payments_pending, name='payments-pending'),
    path('payments/<int:pk>/verify/', payment_api.verify_payment, name='payment-verify'),
    path('payments/mine/', payment_api.payments_mine, name='payments-mine'),
    path('payments/<int:pk>/edit/', payment_api.edit_payment, name='payment-edit'),
    path('doanh-thu-chi-tiet/', payment_api.doanh_thu_chi_tiet, name='doanh-thu-chi-tiet'),
    path('<int:pk>/', views.ContractDetailView.as_view(), name='contract-detail'),
    path('<int:pk>/submit/', views.submit_contract, name='contract-submit'),
    path('<int:pk>/approve/', views.approve_contract, name='contract-approve'),
    path('<int:pk>/deliver/', views.deliver_contract, name='contract-deliver'),
    path('<int:pk>/reject/', views.reject_contract, name='contract-reject'),
    path('<int:pk>/delete/', views.delete_contract, name='contract-delete'),
    path('<int:pk>/payments/', payment_api.contract_payments, name='contract-payments'),
]
