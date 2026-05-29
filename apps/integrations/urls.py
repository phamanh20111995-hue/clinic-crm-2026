from django.urls import path
from . import views

urlpatterns = [
    path('zalo/webhook/', views.zalo_webhook, name='zalo-webhook'),
    path('zalo/send-reminder/<int:appointment_id>/', views.send_reminder, name='zalo-send-reminder'),
    path('zalo/send-tua-link/<int:appointment_id>/', views.send_tua_link, name='zalo-send-tua-link'),
    path('zalo/confirm-tua/', views.confirm_tua_via_zalo, name='zalo-confirm-tua'),
    path('zalo/logs/', views.zalo_message_logs, name='zalo-logs'),
]
