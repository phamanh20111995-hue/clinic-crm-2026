from django.urls import path
from . import views

urlpatterns = [
    path('monthly/', views.monthly_salary, name='salary-monthly'),
    path('calculate/', views.calculate_salary, name='salary-calculate'),
    path('<int:pk>/approve/', views.approve_salary, name='salary-approve'),
    path('configs/', views.SalaryConfigListView.as_view(), name='salary-config-list'),
    path('configs/<int:user_id>/', views.salary_config_detail, name='salary-config-detail'),
    # Cau hinh hoa hong 3P
    path('commission-rates/', views.commission_rate_list, name='commission-rate-list'),
    path('commission-rates/<str:role>/', views.commission_rate_update, name='commission-rate-update'),
    path('service-tua/', views.service_tua_list, name='service-tua-list'),
    path('service-tua/<int:service_id>/', views.service_tua_update, name='service-tua-update'),
    # Bang tua / chia tua (maker-checker 2 lop)
    path('tua-allocations/', views.tua_alloc_list, name='tua-alloc-list'),
    path('tua-allocations/<int:pk>/confirm/', views.tua_alloc_confirm, name='tua-alloc-confirm'),
    path('tua-allocations/<int:pk>/', views.tua_alloc_edit, name='tua-alloc-edit'),
]
