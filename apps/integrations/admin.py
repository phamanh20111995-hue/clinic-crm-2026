from django.contrib import admin
from .models import ZaloConfig, ZaloUserBinding, ZaloMessageLog


@admin.register(ZaloConfig)
class ZaloConfigAdmin(admin.ModelAdmin):
    list_display = ('oa_id', 'token_expires_at', 'updated_at')
    readonly_fields = ('updated_at',)


@admin.register(ZaloUserBinding)
class ZaloUserBindingAdmin(admin.ModelAdmin):
    list_display = ('zalo_user_id', 'display_name', 'user', 'customer', 'created_at')
    search_fields = ('zalo_user_id', 'display_name')


@admin.register(ZaloMessageLog)
class ZaloMessageLogAdmin(admin.ModelAdmin):
    list_display = ('zalo_user_id', 'direction', 'msg_type', 'status', 'created_at')
    list_filter = ('direction', 'msg_type', 'status')
    readonly_fields = ('created_at',)
