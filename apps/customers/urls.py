from django.urls import path
from . import views

urlpatterns = [
    path('',                    views.CustomerListCreateView.as_view(), name='customer-list-create'),
    path('check-phone/',        views.check_phone,                      name='customer-check-phone'),
    path('page-stats/', views.page_stats, name='customer-page-stats'),
    path('cskh-stats/', views.cskh_stats, name='customer-cskh-stats'),
    path('sale-stats/', views.sale_stats, name='customer-sale-stats'),
    path('<int:pk>/',           views.CustomerDetailView.as_view(),     name='customer-detail'),
    path('<int:pk>/assign/',      views.assign_customer,                name='customer-assign'),
    path('<int:pk>/assign-cskh/', views.assign_cskh,                   name='customer-assign-cskh'),
    path('<int:pk>/images/',      views.upload_image,                   name='customer-upload-image'),
]