from django.urls import path
from . import views
from . import payment_api
from . import expense_api
from . import deposit_api

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
    path('payments/<int:pk>/card-settled/', payment_api.confirm_card_settled, name='payment-card-settled'),
    path('doanh-thu-chi-tiet/', payment_api.doanh_thu_chi_tiet, name='doanh-thu-chi-tiet'),
    path('bank-settlement/', payment_api.bank_settlement_list, name='bank-settlement'),
    path('cash-recon/', payment_api.cash_recon, name='cash-recon'),
    # De xuat chi + duyet nhieu tang + so quy chi
    path('expenses/', expense_api.expense_list_create, name='expense-list-create'),
    path('expenses/<int:pk>/approve/', expense_api.expense_approve, name='expense-approve'),
    path('expenses/<int:pk>/reject/', expense_api.expense_reject, name='expense-reject'),
    path('expenses/<int:pk>/pay/', expense_api.expense_pay, name='expense-pay'),
    path('expenses/<int:pk>/edit/', expense_api.expense_edit, name='expense-edit'),
    path('expenses/<int:pk>/delete/', expense_api.expense_delete, name='expense-delete'),
    path('expense-payouts/<int:pk>/pay/', expense_api.expense_payout_pay, name='expense-payout-pay'),
    path('cash-book/', expense_api.cash_book, name='cash-book'),
    path('cash-deposit/', expense_api.cash_deposit, name='cash-deposit'),
    # Dat coc (giu cho cap khach)
    path('deposits/', deposit_api.deposit_list_create, name='deposit-list-create'),
    path('deposits/customer-contracts/', deposit_api.deposit_customer_contracts, name='deposit-customer-contracts'),
    path('deposits/<int:pk>/apply/', deposit_api.deposit_apply, name='deposit-apply'),
    path('deposits/<int:pk>/settle/', deposit_api.deposit_settle, name='deposit-settle'),
    path('deposits/<int:pk>/verify/', deposit_api.deposit_verify, name='deposit-verify'),
    path('deposits/<int:pk>/edit/', deposit_api.deposit_edit, name='deposit-edit'),
    path('deposits/<int:pk>/delete/', deposit_api.deposit_delete, name='deposit-delete'),
    path('<int:pk>/', views.ContractDetailView.as_view(), name='contract-detail'),
    path('<int:pk>/submit/', views.submit_contract, name='contract-submit'),
    path('<int:pk>/approve/', views.approve_contract, name='contract-approve'),
    path('<int:pk>/deliver/', views.deliver_contract, name='contract-deliver'),
    path('<int:pk>/reject/', views.reject_contract, name='contract-reject'),
    path('<int:pk>/delete/', views.delete_contract, name='contract-delete'),
    path('<int:pk>/payments/', payment_api.contract_payments, name='contract-payments'),
]
