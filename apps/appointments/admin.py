from django.contrib import admin
from .models import Appointment

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['customer', 'scheduled_at', 'service', 'status', 'room', 'is_walkin', 'tua_confirmed']
    list_filter = ['status', 'is_walkin', 'tua_confirmed']
    search_fields = ['customer__full_name', 'customer__phone']
    date_hierarchy = 'scheduled_at'
