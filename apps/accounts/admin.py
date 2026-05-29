from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Clinic


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'display_name', 'role', 'is_active', 'created_at']
    list_filter = ['role', 'is_active']
    search_fields = ['email', 'first_name', 'last_name', 'phone']
    ordering = ['-created_at']
    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Thông tin cá nhân', {'fields': ('first_name', 'last_name', 'phone', 'avatar')}),
        ('Vai trò & Quyền', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
    )


@admin.register(Clinic)
class ClinicAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'is_active']
