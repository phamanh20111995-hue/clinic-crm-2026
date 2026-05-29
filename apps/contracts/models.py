from django.db import models
from django.conf import settings


class Contract(models.Model):
    contract_no = models.CharField(max_length=20, unique=True)  # HĐ-2026-001
    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE, related_name='contracts')
    appointment = models.ForeignKey(
        'appointments.Appointment', null=True, blank=True, on_delete=models.SET_NULL,
    )

    items = models.JSONField(default=list)       # [{service_id, name, sessions, price, discount}]
    promotions = models.JSONField(default=list)  # KM inline
    gifts = models.JSONField(default=list)       # Tặng kèm inline

    total_amount = models.DecimalField(max_digits=15, decimal_places=0)
    discount_amount = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    final_amount = models.DecimalField(max_digits=15, decimal_places=0)

    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Tiền mặt'), ('transfer', 'Chuyển khoản'), ('combined', 'Kết hợp'),
    ]
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    cash_amount = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    transfer_amount = models.DecimalField(max_digits=15, decimal_places=0, default=0)

    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Chưa nhận'), ('received', 'Đã nhận'), ('partial', 'Nhận một phần'),
    ]
    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS_CHOICES, default='pending')

    APPROVAL_STATUS_CHOICES = [
        ('draft', 'Nháp'), ('pending_kt', 'Chờ KT duyệt'),
        ('approved', 'Đã duyệt'), ('rejected', 'Từ chối'),
    ]
    approval_status = models.CharField(max_length=15, choices=APPROVAL_STATUS_CHOICES, default='draft')

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='created_contracts',
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='approved_contracts',
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)  # Soft delete
    created_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Hợp đồng'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.contract_no} — {self.customer}'
