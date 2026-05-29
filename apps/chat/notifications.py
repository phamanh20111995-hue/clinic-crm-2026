"""
Helper to create a Notification record and push it via WebSocket.
Usage from any view/signal:
    from apps.chat.notifications import send_notification
    send_notification(user, 'kh_checkin', 'KH vừa check-in', body='...', data={...})
"""
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.utils import timezone


def send_notification(recipient, notif_type, title, body='', data=None):
    from .models import Notification
    notif = Notification.objects.create(
        recipient=recipient,
        notif_type=notif_type,
        title=title,
        body=body,
        data=data or {},
    )
    channel_layer = get_channel_layer()
    if channel_layer is not None:
        group_name = f'notifications_{recipient.id}'
        async_to_sync(channel_layer.group_send)(group_name, {
            'type': 'notification_message',
            'notif_type': notif_type,
            'title': title,
            'body': body,
            'data': data or {},
            'notification_id': notif.id,
            'created_at': notif.created_at.isoformat(),
        })
    return notif


def send_notification_to_role(role, notif_type, title, body='', data=None):
    """Broadcast to all users with a given role."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    for user in User.objects.filter(role=role, is_active=True):
        send_notification(user, notif_type, title, body=body, data=data)


def send_notification_to_roles(roles, notif_type, title, body='', data=None):
    """Broadcast to all users with any of the given roles."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    for user in User.objects.filter(role__in=roles, is_active=True):
        send_notification(user, notif_type, title, body=body, data=data)
