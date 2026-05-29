from django.urls import path
from . import views

urlpatterns = [
    path('channels/', views.ChannelListCreateView.as_view(), name='channel-list-create'),
    path('channels/<int:pk>/', views.ChannelDetailView.as_view(), name='channel-detail'),
    path('channels/<int:channel_id>/messages/', views.MessageListCreateView.as_view(), name='message-list-create'),
    path('messages/<int:message_id>/pin/', views.pin_message, name='message-pin'),
    path('notifications/', views.NotificationListView.as_view(), name='notification-list'),
    path('notifications/<int:pk>/read/', views.mark_notification_read, name='notification-read'),
    path('notifications/read-all/', views.mark_all_notifications_read, name='notification-read-all'),
]
