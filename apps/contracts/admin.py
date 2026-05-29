from django.contrib import admin
from .models import Contract


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ('contract_no', 'customer', 'created_by', 'approval_status', 'payment_status', 'final_amount', 'created_at')
    list_filter = ('approval_status', 'payment_status', 'payment_method', 'is_deleted')
    search_fields = ('contract_no', 'customer__full_name', 'customer__phone')
    readonly_fields = ('contract_no', 'created_by', 'approved_by', 'approved_at', 'created_at')
    date_hierarchy = 'created_at'

    def get_queryset(self, request):
        return super().get_queryset(request).filter(is_deleted=False)
