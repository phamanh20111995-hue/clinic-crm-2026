from django.contrib import admin
from .models import Customer, CallHistory, ReturnRequest

class CallHistoryInline(admin.TabularInline):
    model = CallHistory; extra = 0; readonly_fields = ['called_at']

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['full_name','phone','status','data_type','source','tele','sale','created_at']
    list_filter = ['status','data_type','source','is_deleted']
    search_fields = ['full_name','phone']
    inlines = [CallHistoryInline]

@admin.register(ReturnRequest)
class ReturnRequestAdmin(admin.ModelAdmin):
    list_display = ['customer','reason_type','status','requested_by','created_at']
    list_filter = ['status','reason_type']
