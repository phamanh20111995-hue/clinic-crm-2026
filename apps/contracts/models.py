from django.db import models
from django.conf import settings
class Contract(models.Model):
    contract_no = models.CharField(max_length=20, unique=True)
    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE, related_name='contracts')
    appointment = models.ForeignKey('appointments.Appointment', null=True, blank=True, on_delete=models.SET_NULL)
    items = models.JSONField(default=list)
    promotions = models.JSONField(default=list)
    gifts = models.JSONField(default=list)
    total_amount = models.DecimalField(max_digits=15, decimal_places=0)
    discount_amount = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    final_amount = models.DecimalField(max_digits=15, decimal_places=0)
    PAYMENT_METHOD_CHOICES = [('cash','Tiền mặt'),('transfer','Chuyển khoản'),('combined','Kết hợp')]
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    cash_amount = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    transfer_amount = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    PAYMENT_STATUS_CHOICES = [('pending','Chưa nhận'),('received','Đã nhận'),('partial','Nhận một phần')]
    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS_CHOICES, default='pending')
    APPROVAL_STATUS_CHOICES = [('draft','Nháp'),('pending_kt','Chờ KT duyệt'),('approved','Đã duyệt'),('rejected','Từ chối')]
    approval_status = models.CharField(max_length=15, choices=APPROVAL_STATUS_CHOICES, default='draft')
    SALE_ROUND_CHOICES = [('sale', 'Sale (vòng 1)'), ('upsale', 'Upsale (vòng 2+)')]
    sale_round = models.CharField(max_length=10, choices=SALE_ROUND_CHOICES, default='sale')
    so_buoi = models.PositiveIntegerField(default=0, help_text='Tong so buoi lieu trinh mua')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_contracts')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_contracts')
    approved_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    class Meta: verbose_name='Hợp đồng'; ordering=['-created_at']
    def __str__(self): return f'{self.contract_no} — {self.customer}'

class TreatmentCourse(models.Model):
    """Lieu trinh theo tung dich vu, sinh ra khi chot HD."""
    contract = models.ForeignKey('Contract', on_delete=models.CASCADE, related_name='courses')
    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE, related_name='treatment_courses')
    service = models.ForeignKey('services.Service', on_delete=models.PROTECT, related_name='courses')
    so_buoi = models.PositiveIntegerField(default=0, help_text='Tong so buoi mua cho dich vu nay')
    note = models.TextField(blank=True)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Lieu trinh'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.customer} - {self.service} ({self.so_buoi} buoi)'

    @property
    def so_buoi_da_dung(self):
        return self.sessions.filter(is_deleted=False).count()

    @property
    def buoi_con_lai(self):
        return max(0, self.so_buoi - self.so_buoi_da_dung)


class TreatmentSession(models.Model):
    """Tung buoi thuc hien lieu trinh."""
    course = models.ForeignKey('TreatmentCourse', on_delete=models.CASCADE, related_name='sessions')
    appointment = models.ForeignKey('appointments.Appointment', null=True, blank=True, on_delete=models.SET_NULL, related_name='treatment_sessions')
    date = models.DateField(null=True, blank=True)
    ktv = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='treatment_sessions')
    notes = models.TextField(blank=True)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Buoi dieu tri'
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f'Buoi {self.date} - {self.course}'
