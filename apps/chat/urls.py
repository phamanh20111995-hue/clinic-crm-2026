from django.urls import path
from . import views

urlpatterns = [
    path('contacts/', views.chat_contacts, name='chat-contacts'),
    path('channels/', views.ChannelListCreateView.as_view(), name='channel-list-create'),
    path('channels/<int:pk>/', views.ChannelDetailView.as_view(), name='channel-detail'),
    path('channels/direct/', views.get_or_create_direct, name='channel-direct'),
    path('channels/<int:channel_id>/messages/', views.MessageListCreateView.as_view(), name='message-list-create'),
    path('channels/<int:pk>/members/', views.add_members, name='channel-add-members'),
    path('channels/<int:pk>/leave/', views.leave_channel, name='channel-leave'),
    path('channels/<int:pk>/remove-member/', views.remove_member, name='channel-remove-member'),
    path('channels/<int:pk>/disband/', views.disband_channel, name='channel-disband'),
    path('channels/<int:pk>/promote-admin/', views.promote_admin, name='channel-promote-admin'),
    path('channels/<int:pk>/demote-admin/', views.demote_admin, name='channel-demote-admin'),
    path('channels/<int:pk>/transfer-owner/', views.transfer_owner, name='channel-transfer-owner'),
    path('messages/<int:message_id>/pin/', views.pin_message, name='message-pin'),
    path('notifications/', views.NotificationListView.as_view(), name='notification-list'),
    path('notifications/<int:pk>/read/', views.mark_notification_read, name='notification-read'),
    path('notifications/read-all/', views.mark_all_notifications_read, name='notification-read-all'),
]
