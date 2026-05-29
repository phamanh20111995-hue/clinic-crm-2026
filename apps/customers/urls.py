from django.urls import path
from . import views

urlpatterns = [
    path('',                    views.CustomerListCreateView.as_view(), name='customer-list-create'),
    path('check-phone/',        views.check_phone,                      name='customer-check-phone'),
    path('<int:pk>/',           views.CustomerDetailView.as_view(),     name='customer-detail'),
    path('<int:pk>/assign/',    views.assign_customer,                  name='customer-assign'),
    path('<int:pk>/images/',    views.upload_image,                     name='customer-upload-image'),
]
