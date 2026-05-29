from django.db import models
from django.conf import settings


class ZaloConfig(models.Model):
    """Cấu hình Zalo OA — lưu token, OA ID (chỉ 1 bản ghi duy nhất)."""
    oa_id = models.CharField(max_length=100, unique=True)
    access_token = models.TextField()
    refresh_token = models.TextField()
    token_expires_at = models.DateTimeField(null=True, blank=True)
    webhook_secret = models.CharField(max_length=200, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Zalo OA Config'

    def __str__(self):
        return f"Zalo OA {self.oa_id}"


class ZaloUserBinding(models.Model):
    """Liên kết User nội bộ / Customer ↔ Zalo user_id (follower)."""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='zalo_binding', null=True, blank=True,
    )
    zalo_user_id = models.CharField(max_length=100, unique=True)
    display_name = models.CharField(max_length=200, blank=True)
    avatar_url = models.URLField(blank=True)
    customer = models.OneToOneField(
        'customers.Customer', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='zalo_binding',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Zalo {self.zalo_user_id}"


class ZaloMessageLog(models.Model):
    DIRECTION_CHOICES = [('out', 'Gửi đi'), ('in', 'Nhận về')]
    MSG_TYPE_CHOICES = [
        ('appointment_reminder', 'Nhắc lịch hẹn'),
        ('tua_confirm', 'Xác nhận tua'),
        ('contract_info', 'Thông tin HĐ'),
        ('general', 'Chung'),
        ('webhook_in', 'Webhook nhận'),
    ]
    zalo_user_id = models.CharField(max_length=100)
    direction = models.CharField(max_length=4, choices=DIRECTION_CHOICES)
    msg_type = models.CharField(max_length=30, choices=MSG_TYPE_CHOICES, default='general')
    message_id = models.CharField(max_length=200, blank=True)
    content = models.TextField()
    status = models.CharField(max_length=20, default='sent')
    error = models.TextField(blank=True)
    related_appointment_id = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.direction} {self.msg_type} → {self.zalo_user_id}"
