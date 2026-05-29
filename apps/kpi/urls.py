from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.kpi_dashboard, name='kpi-dashboard'),
    path('tele/', views.kpi_tele, name='kpi-tele'),
    path('sale/', views.kpi_sale, name='kpi-sale'),
    path('truc-page/', views.kpi_truc_page, name='kpi-truc-page'),
    path('targets/', views.kpi_targets, name='kpi-targets'),
]
