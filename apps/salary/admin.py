from django.contrib import admin
from .models import SalaryConfig, MonthlySalary


@admin.register(SalaryConfig)
class SalaryConfigAdmin(admin.ModelAdmin):
    list_display = ('user', 'base_salary', 'commission_rate', 'tua_rate')
    search_fields = ('user__email',)


@admin.register(MonthlySalary)
class MonthlySalaryAdmin(admin.ModelAdmin):
    list_display = ('user', 'month', 'year', 'base', 'commission', 'tua_income',
                    'deductions', 'total', 'status')
    list_filter = ('status', 'year', 'month')
    search_fields = ('user__email',)
    readonly_fields = ('created_at', 'approved_by', 'approved_at')
