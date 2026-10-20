from django.contrib import admin
from .models import Supplier, Product, StockEntry, StockEntryLine, StockMovement, SupplierPayment


class StockEntryLineInline(admin.TabularInline):
    model = StockEntryLine
    extra = 1


@admin.register(StockEntry)
class StockEntryAdmin(admin.ModelAdmin):
    list_display = ('entry_no', 'supplier', 'date', 'payment_status', 'total_cost')
    inlines = [StockEntryLineInline]


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'stock', 'cost_price', 'sell_price', 'min_stock', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('name', 'sku')


admin.site.register(Supplier)
admin.site.register(StockMovement)
admin.site.register(SupplierPayment)
