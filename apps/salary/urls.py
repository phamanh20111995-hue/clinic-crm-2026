from django.urls import path
from . import views

urlpatterns = [
    path('monthly/', views.monthly_salary, name='salary-monthly'),
    path('calculate/', views.calculate_salary, name='salary-calculate'),
    path('<int:pk>/approve/', views.approve_salary, name='salary-approve'),
    path('configs/', views.SalaryConfigListView.as_view(), name='salary-config-list'),
    path('configs/<int:user_id>/', views.salary_config_detail, name='salary-config-detail'),
]
