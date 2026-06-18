from django.db import models
from django.conf import settings


class ChatChannel(models.Model):
    CHANNEL_TYPES = [('group', 'Nhóm'), ('direct', 'Trực tiếp')]
    channel_type = models.CharField(max_length=10, choices=CHANNEL_TYPES)
    name = models.CharField(max_length=100, blank=True)
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='channels')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_channels')
    admins = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='admin_channels', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name or f"Channel #{self.pk}"


class Message(models.Model):
    MESSAGE_TYPES = [
        ('text', 'Text'), ('file', 'File'), ('image', 'Ảnh'), ('video', 'Video'),
        ('system', 'Hệ thống'), ('kh_share', 'Chia sẻ KH'), ('hd_share', 'Chia sẻ HĐ'),
    ]
    channel = models.ForeignKey(ChatChannel, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='sent_messages')
    content = models.TextField(blank=True)
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='text')
    file = models.FileField(upload_to='chat_files/', blank=True)
    metadata = models.JSONField(default=dict)
    is_pinned = models.BooleanField(default=False)
    is_recalled = models.BooleanField(default=False)
    is_edited = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender} → {self.channel}: {self.content[:50]}"


class Notification(models.Model):
    NOTIF_TYPES = [
        ('kh_checkin', 'KH Check-in'),
        ('hd_pending_kt', 'HĐ chờ KT duyệt'),
        ('hd_approved', 'HĐ đã duyệt'),
        ('hd_rejected', 'HĐ bị từ chối'),
        ('return_request', 'Hoàn số'),
        ('absence_alert', 'Vắng mặt'),
        ('appointment_reminder', 'Nhắc lịch hẹn'),
        ('general', 'Chung'),
    ]
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    notif_type = models.CharField(max_length=30, choices=NOTIF_TYPES)
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True)
    data = models.JSONField(default=dict)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.notif_type} → {self.recipient}: {self.title}"
