from django.db import models
from django.conf import settings


class SalaryConfig(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='salary_config')
    base_salary = models.DecimalField(max_digits=12, decimal_places=0)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tua_rate = models.DecimalField(max_digits=8, decimal_places=0, default=0)

    class Meta:
        verbose_name = 'Cấu hình lương'


class MonthlySalary(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='monthly_salaries')
    month = models.IntegerField()
    year = models.IntegerField()
    working_days = models.IntegerField()
    base = models.DecimalField(max_digits=12, decimal_places=0)
    commission = models.DecimalField(max_digits=12, decimal_places=0, default=0)
    tua_income = models.DecimalField(max_digits=12, decimal_places=0, default=0)
    deductions = models.DecimalField(max_digits=12, decimal_places=0, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=0)
    STATUS_CHOICES = [('draft', 'Nháp'), ('approved', 'Đã duyệt'), ('paid', 'Đã thanh toán')]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')

    class Meta:
        unique_together = ['user', 'month', 'year']
        verbose_name = 'Lương tháng'
        ordering = ['-year', '-month']
