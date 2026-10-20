from django.db import models
from django.conf import settings


class Supplier(models.Model):
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20, blank=True)
    note = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Nhà cung cấp'
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    CATEGORY_CHOICES = [
        ('my_pham', 'Mỹ phẩm'),
        ('thuoc_ke_don', 'Thuốc kê đơn'),
        ('thuoc_khong_ke_don', 'Thuốc không kê đơn'),
    ]
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=50, blank=True)
    unit = models.CharField(max_length=20, default='Cái')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='my_pham')
    cost_price = models.DecimalField(max_digits=15, decimal_places=0, default=0, help_text='Giá vốn bình quân gia quyền')
    sell_price = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    stock = models.IntegerField(default=0, help_text='Tồn kho hiện tại')
    min_stock = models.IntegerField(default=0, help_text='Định mức cảnh báo')
    is_prescription = models.BooleanField(default=False, help_text='Thuốc kê đơn')
    is_active = models.BooleanField(default=True)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Sản phẩm'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class StockEntry(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ('paid', 'Đã trả'),
        ('debt', 'Còn nợ'),
        ('partial', 'Trả một phần'),
    ]
    entry_no = models.CharField(max_length=30, unique=True)
    supplier = models.ForeignKey(Supplier, null=True, blank=True, on_delete=models.SET_NULL, related_name='entries')
    date = models.DateField(null=True, blank=True)
    attachment = models.FileField(upload_to='stock_entries/%Y/%m/', blank=True)
    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS_CHOICES, default='debt')
    total_cost = models.DecimalField(max_digits=15, decimal_places=0, default=0, help_text='Tổng tiền phải trả NCC')
    note = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name='stock_entries')
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Phiếu nhập kho'
        ordering = ['-created_at']

    def __str__(self):
        return self.entry_no


class StockEntryLine(models.Model):
    entry = models.ForeignKey(StockEntry, on_delete=models.CASCADE, related_name='lines')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='entry_lines')
    qty = models.IntegerField(default=0)
    cost_price = models.DecimalField(max_digits=15, decimal_places=0, default=0, help_text='0 nếu NCC tặng')
    is_gift = models.BooleanField(default=False, help_text='Hàng NCC tặng (giá vốn 0)')

    class Meta:
        verbose_name = 'Dòng nhập kho'

    def __str__(self):
        return f'{self.product} x{self.qty}'


class StockMovement(models.Model):
    REASON_CHOICES = [
        ('nhap', 'Nhập kho'),
        ('ban', 'Bán'),
        ('tang', 'Tặng KH'),
        ('huy', 'Hủy'),
        ('kiem_ke', 'Kiểm kê'),
    ]
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='movements')
    change = models.IntegerField(default=0, help_text='+ nhập / - xuất')
    reason = models.CharField(max_length=10, choices=REASON_CHOICES)
    ref_type = models.CharField(max_length=20, blank=True, help_text='contract / stock_entry')
    ref_id = models.IntegerField(null=True, blank=True)
    cost_at_time = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    note = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name='stock_movements')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Biến động kho'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.product} {self.change:+d}'


class SupplierPayment(models.Model):
    METHOD_CHOICES = [
        ('cash', 'Tiền mặt'),
        ('transfer', 'Chuyển khoản'),
    ]
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='payments')
    entry = models.ForeignKey(StockEntry, null=True, blank=True, on_delete=models.SET_NULL, related_name='payments')
    amount = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    method = models.CharField(max_length=10, choices=METHOD_CHOICES, default='transfer')
    date = models.DateField(null=True, blank=True)
    note = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name='supplier_payments')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Trả nhà cung cấp'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.supplier} - {self.amount}'
