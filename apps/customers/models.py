from django.db import models
from django.conf import settings

class Customer(models.Model):
    full_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=15, unique=True)
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=[('M','Nam'),('F','Nữ')], blank=True)
    address = models.TextField(blank=True)
    SOURCE_CHOICES = [
        ('facebook','Facebook'),('tiktok','TikTok'),('zalo','Zalo'),
        ('google','Google/Maps'),('instagram','Instagram'),
        ('gioi_thieu','Giới thiệu'),('walkin','Walk-in'),('khac','Không xác định'),
    ]
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    DATA_TYPE_CHOICES = [('nong','Nóng'),('am','Âm'),('thuong','Thường')]
    data_type = models.CharField(max_length=10, choices=DATA_TYPE_CHOICES, default='thuong')
    sale = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name='customers', limit_choices_to={'role':'SALE'})
    tele = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name='tele_customers', limit_choices_to={'role':'TELE'})
    STATUS_CHOICES = [
        ('chua_goi','Chưa gọi'),('da_goi','Đã gọi'),
        ('khong_nghe','Không nghe máy'),('thue_bao','Thuê bao'),
        ('sai_so','Sai số'),('tu_choi','Từ chối'),('hoan_so','Hoàn số'),
        ('dat_lich','Đặt lịch'),('hen_goi','Hẹn gọi lại'),
        ('can_tv','Cần tư vấn thêm'),('khong_qt','Không quan tâm'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='chua_goi')
    call_count = models.IntegerField(default=0)
    notes = models.TextField(blank=True)
    is_deleted = models.BooleanField(default=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='created_customers')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name='Khách hàng'; verbose_name_plural='Khách hàng'; ordering=['-created_at']

    def __str__(self):
        return f'{self.full_name} — {self.phone}'


class CustomerImage(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='customer_images/%Y/%m/')
    IMAGE_TYPE_CHOICES = [('truoc','Trước ĐT'),('trong','Trong ĐT'),('sau','Sau ĐT'),('tinh_trang','Tình trạng')]
    image_type = models.CharField(max_length=20, choices=IMAGE_TYPE_CHOICES)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)


class CallHistory(models.Model):
    """Lịch sử gọi Tele — lần 1-20."""
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='calls')
    tele = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='call_histories')
    call_number = models.IntegerField()
    result = models.CharField(max_length=20, choices=Customer.STATUS_CHOICES)
    consult_result = models.CharField(max_length=20, blank=True)
    notes = models.TextField(blank=True)
    recording_file = models.FileField(upload_to='recordings/', blank=True)
    called_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name='Lịch sử gọi'; ordering=['-called_at']


class ReturnRequest(models.Model):
    """Yêu cầu hoàn số — cần Lead Tele duyệt."""
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='return_requests')
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='return_requests')
    reason = models.TextField()
    recording_file = models.FileField(upload_to='recordings/')
    REASON_CHOICES = [
        ('treu','KH trêu / số ảo'),('khong_ton_tai','Số không tồn tại'),
        ('nham_so','Không nhớ để lại số'),('trung','Số trùng KH cũ'),
    ]
    reason_type = models.CharField(max_length=20, choices=REASON_CHOICES)
    STATUS_CHOICES = [('pending','Chờ duyệt'),('approved','Đã duyệt'),('rejected','Từ chối')]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='reviewed_returns')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name='Yêu cầu hoàn số'; ordering=['-created_at']
