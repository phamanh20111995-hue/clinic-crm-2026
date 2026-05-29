from django.db import models
from django.conf import settings


class SalaryConfig(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='salary_config')
    base_salary = models.DecimalField(max_digits=12, decimal_places=0)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0,
                                          help_text='% hoa hồng trên doanh thu HĐ')
    tua_rate = models.DecimalField(max_digits=8, decimal_places=0, default=0,
                                   help_text='Tiền thưởng mỗi tua xác nhận (VNĐ)')
    late_deduct_per_minute = models.DecimalField(max_digits=8, decimal_places=0, default=0,
                                                  help_text='Khấu trừ mỗi phút đi muộn (VNĐ)')
    absent_deduct_per_day = models.DecimalField(max_digits=10, decimal_places=0, default=0,
                                                 help_text='Khấu trừ mỗi ngày vắng không phép (VNĐ)')

    class Meta:
        verbose_name = 'Cấu hình lương'

    def __str__(self):
        return f"Lương {self.user}: {self.base_salary:,.0f} VNĐ"


class MonthlySalary(models.Model):
    STATUS_CHOICES = [('draft', 'Nháp'), ('approved', 'Đã duyệt'), ('paid', 'Đã thanh toán')]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='monthly_salaries')
    month = models.IntegerField()
    year = models.IntegerField()
    working_days = models.IntegerField(default=0)
    actual_days = models.IntegerField(default=0, help_text='Ngày thực tế có mặt')
    late_minutes_total = models.IntegerField(default=0)
    absent_days = models.IntegerField(default=0)
    base = models.DecimalField(max_digits=12, decimal_places=0)
    commission = models.DecimalField(max_digits=12, decimal_places=0, default=0)
    tua_income = models.DecimalField(max_digits=12, decimal_places=0, default=0)
    deductions = models.DecimalField(max_digits=12, decimal_places=0, default=0)
    bonus = models.DecimalField(max_digits=12, decimal_places=0, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=0)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                    null=True, blank=True, related_name='approved_salaries')
    approved_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'month', 'year']
        ordering = ['-year', '-month']

    def __str__(self):
        return f"{self.user} — {self.month}/{self.year} — {self.total:,.0f} VNĐ"
