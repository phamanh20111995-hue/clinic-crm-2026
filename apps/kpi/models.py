from django.db import models
from django.conf import settings


class KPIRecord(models.Model):
    """KPI tháng theo role — tele/sale/cskh."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='kpi_records')
    month = models.IntegerField()
    year = models.IntegerField()

    # Tele KPI
    calls_target = models.IntegerField(default=0)
    calls_actual = models.IntegerField(default=0)
    appointments_target = models.IntegerField(default=0)
    appointments_actual = models.IntegerField(default=0)

    # Sale KPI
    revenue_target = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    revenue_actual = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    contracts_target = models.IntegerField(default=0)
    contracts_actual = models.IntegerField(default=0)

    achievement_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'month', 'year']
        verbose_name = 'KPI'
        ordering = ['-year', '-month']
