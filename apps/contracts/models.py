from django.db import models
from django.conf import settings
class Contract(models.Model):
    contract_no = models.CharField(max_length=20, unique=True)
    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE, related_name='contracts')
    appointment = models.ForeignKey('appointments.Appointment', null=True, blank=True, on_delete=models.SET_NULL)
    clinic = models.ForeignKey('accounts.Clinic', null=True, blank=True, on_delete=models.SET_NULL, related_name='contracts')
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


class Payment(models.Model):
    """Mot lan thu tien cho hop dong. 1 HD co the co nhieu Payment (tra gop)."""
    contract = models.ForeignKey('Contract', on_delete=models.CASCADE, related_name='payments')
    total = models.DecimalField(max_digits=15, decimal_places=0, default=0, help_text='Tong lan thu = tien mat + chuyen khoan + tra gop')
    cash_amount = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    transfer_amount = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    installment_amount = models.DecimalField(max_digits=15, decimal_places=0, default=0, help_text='Phan tra gop qua don vi tai chinh')
    received_at = models.DateField(null=True, blank=True)
    received_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='payments_received')
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    VERIFY_STATUS_CHOICES = [
        ('cho_xac_nhan', 'Chờ xác nhận'),
        ('da_xac_nhan', 'Đã xác nhận'),
        ('lech', 'Lệch - cần sửa'),
    ]
    verify_status = models.CharField(max_length=15, choices=VERIFY_STATUS_CHOICES, default='cho_xac_nhan')
    verified_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='payments_verified')
    verified_at = models.DateTimeField(null=True, blank=True)
    verify_note = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Phieu thu tien'
        ordering = ['-received_at', '-created_at']

    def __str__(self):
        return f'{self.contract.contract_no} - {self.total}'


class Installment(models.Model):
    """Chi tiet phan tra gop cua mot Payment: nha tai tro, phi chuyen doi, lai, giai ngan."""
    PROVIDER_TYPE_CHOICES = [
        ('vay_tieu_dung', 'Vay tiêu dùng'),
        ('the_tin_dung', 'Thẻ tín dụng'),
    ]
    BEARER_CHOICES = [
        ('pk', 'Phòng khám chịu'),
        ('khach', 'Khách chịu'),
        ('chia', 'Chia'),
    ]
    STATUS_CHOICES = [
        ('cho_duyet', 'Chờ duyệt hồ sơ'),
        ('cho_giai_ngan', 'Chờ giải ngân'),
        ('da_ve', 'Đã giải ngân'),
    ]
    payment = models.ForeignKey('Payment', on_delete=models.CASCADE, related_name='installments')
    provider = models.CharField(max_length=100, help_text='Home Credit / FE Credit / VNPAY...')
    provider_type = models.CharField(max_length=20, choices=PROVIDER_TYPE_CHOICES, default='vay_tieu_dung')
    principal = models.DecimalField(max_digits=15, decimal_places=0, default=0, help_text='Goc - khau tru no khach')
    conversion_fee = models.DecimalField(max_digits=15, decimal_places=0, default=0, help_text='Phi chuyen doi')
    fee_bearer = models.CharField(max_length=10, choices=BEARER_CHOICES, default='khach')
    fee_pk = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    fee_khach = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    interest = models.DecimalField(max_digits=15, decimal_places=0, default=0, help_text='Lai tra gop')
    interest_bearer = models.CharField(max_length=10, choices=BEARER_CHOICES, default='khach')
    interest_pk = models.DecimalField(max_digits=15, decimal_places=0, default=0, help_text='Lai PK chiu (hoan khach)')
    interest_khach = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    pk_net = models.DecimalField(max_digits=15, decimal_places=0, default=0, help_text='PK thuc nhan')
    pk_cost = models.DecimalField(max_digits=15, decimal_places=0, default=0, help_text='Chi phi PK = fee_pk + interest_pk')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='cho_giai_ngan')
    expected_date = models.DateField(null=True, blank=True, help_text='Ngay du kien ve ket (T+1 tru T6/7/CN)')
    actual_date = models.DateField(null=True, blank=True, help_text='Ngay thuc ve ket')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Khoan tra gop'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.provider} - {self.principal}'


class ContractCredit(models.Model):
    """Quy doanh thu HD cho tung nguoi theo vai tro (snapshot bat bien luc duyet HD).
    KHONG chua % chia (them sau o man Luong). BS/KTV khong vao day (da co o TreatmentSession)."""
    ROLE_CHOICES = [
        ('SALE', 'Sale'), ('TELE', 'Tele'), ('CSKH', 'CSKH'),
        ('ADS', 'Marketing/Ads'), ('TRUC_PAGE', 'Truc page'),
    ]
    contract = models.ForeignKey('Contract', on_delete=models.CASCADE, related_name='credits')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='revenue_credits')
    role = models.CharField(max_length=15, choices=ROLE_CHOICES)
    clinic = models.ForeignKey('accounts.Clinic', null=True, blank=True, on_delete=models.SET_NULL)
    region = models.CharField(max_length=20, blank=True, help_text='Snapshot mien luc duyet HD')
    share_pct = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text='Dien sau o man Luong')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['contract', 'user', 'role']
        verbose_name = 'Quy doanh thu HD'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.contract.contract_no} - {self.get_role_display()} - {self.user}'
