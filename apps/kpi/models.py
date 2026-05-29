from django.db import models
from django.conf import settings


class KPITarget(models.Model):
    """Mục tiêu KPI theo tháng/năm cho từng nhân viên (HR thiết lập)."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='kpi_targets')
    month = models.IntegerField()
    year = models.IntegerField()
    calls_target = models.IntegerField(default=0)
    appointments_target = models.IntegerField(default=0)
    revenue_target = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    contracts_target = models.IntegerField(default=0)

    class Meta:
        unique_together = ['user', 'month', 'year']
        ordering = ['-year', '-month']

    def __str__(self):
        return f"Target {self.user} {self.month}/{self.year}"


class KPIRecord(models.Model):
    """Kết quả KPI thực tế (tính tự động từ dữ liệu hệ thống)."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='kpi_records')
    month = models.IntegerField()
    year = models.IntegerField()
    calls_target = models.IntegerField(default=0)
    calls_actual = models.IntegerField(default=0)
    appointments_target = models.IntegerField(default=0)
    appointments_actual = models.IntegerField(default=0)
    revenue_target = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    revenue_actual = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    contracts_target = models.IntegerField(default=0)
    contracts_actual = models.IntegerField(default=0)
    tua_count = models.IntegerField(default=0, help_text='Số tua xác nhận trong tháng')
    achievement_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0,
                                           help_text='% hoàn thành KPI tổng hợp')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'month', 'year']
        ordering = ['-year', '-month']

    def __str__(self):
        return f"KPI {self.user} {self.month}/{self.year} — {self.achievement_rate}%"
