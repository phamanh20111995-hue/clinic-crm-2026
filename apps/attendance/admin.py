from django.contrib import admin
from .models import WorkShift, ShiftAssignment, AttendanceRecord, LeaveRequest


@admin.register(WorkShift)
class WorkShiftAdmin(admin.ModelAdmin):
    list_display = ('name', 'start_time', 'end_time', 'allowed_late_minutes')


@admin.register(ShiftAssignment)
class ShiftAssignmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'shift', 'date')
    list_filter = ('shift', 'date')
    search_fields = ('user__email', 'user__first_name', 'user__last_name')
    date_hierarchy = 'date'


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'check_in', 'check_out', 'status', 'source', 'late_minutes')
    list_filter = ('status', 'source', 'date')
    search_fields = ('user__email', 'user__first_name', 'user__last_name')
    date_hierarchy = 'date'


@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ('user', 'leave_type', 'start_date', 'end_date', 'status', 'approved_by', 'created_at')
    list_filter = ('status', 'leave_type')
    search_fields = ('user__email',)
