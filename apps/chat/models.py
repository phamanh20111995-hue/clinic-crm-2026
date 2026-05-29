from django.db import models
from django.conf import settings


class ChatChannel(models.Model):
    CHANNEL_TYPES = [('group', 'Nhóm'), ('direct', 'Trực tiếp')]
    channel_type = models.CharField(max_length=10, choices=CHANNEL_TYPES)
    name = models.CharField(max_length=100, blank=True)
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='channels')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Kênh chat'


class Message(models.Model):
    channel = models.ForeignKey(ChatChannel, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='sent_messages')
    content = models.TextField(blank=True)
    MESSAGE_TYPES = [
        ('text', 'Text'), ('file', 'File'), ('image', 'Ảnh'),
        ('system', 'Hệ thống'), ('kh_share', 'Chia sẻ KH'), ('hd_share', 'Chia sẻ HĐ'),
    ]
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='text')
    file = models.FileField(upload_to='chat_files/', blank=True)
    metadata = models.JSONField(default=dict)
    is_pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Tin nhắn'
        ordering = ['created_at']
