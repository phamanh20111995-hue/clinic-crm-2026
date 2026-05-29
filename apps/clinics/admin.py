from django.contrib import admin
from .models import Room

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['name', 'clinic', 'room_type', 'capacity', 'is_active']
    list_filter = ['clinic', 'room_type', 'is_active']
