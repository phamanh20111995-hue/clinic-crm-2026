from django.contrib import admin
from .models import KPITarget, KPIRecord


@admin.register(KPITarget)
class KPITargetAdmin(admin.ModelAdmin):
    list_display = ('user', 'month', 'year', 'calls_target', 'appointments_target',
                    'revenue_target', 'contracts_target')
    list_filter = ('year', 'month')
    search_fields = ('user__email',)


@admin.register(KPIRecord)
class KPIRecordAdmin(admin.ModelAdmin):
    list_display = ('user', 'month', 'year', 'calls_actual', 'appointments_actual',
                    'revenue_actual', 'contracts_actual', 'achievement_rate', 'updated_at')
    list_filter = ('year', 'month')
    search_fields = ('user__email',)
    readonly_fields = ('updated_at',)
