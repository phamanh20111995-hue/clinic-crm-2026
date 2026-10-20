from django.db import transaction
from rest_framework import serializers
from .models import Supplier, Product, StockEntry, StockEntryLine, StockMovement, SupplierPayment


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'phone', 'note', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class ProductSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    profit = serializers.SerializerMethodField()
    is_low_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'sku', 'unit', 'category', 'category_display',
                  'cost_price', 'sell_price', 'profit', 'stock', 'min_stock',
                  'is_low_stock', 'is_prescription', 'is_active', 'created_at']
        read_only_fields = ['id', 'cost_price', 'stock', 'created_at']

    def get_profit(self, obj):
        return obj.sell_price - obj.cost_price

    def get_is_low_stock(self, obj):
        return obj.stock <= obj.min_stock


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    reason_display = serializers.CharField(source='get_reason_display', read_only=True)

    class Meta:
        model = StockMovement
        fields = ['id', 'product', 'product_name', 'change', 'reason', 'reason_display',
                  'ref_type', 'ref_id', 'cost_at_time', 'note', 'created_at']
        read_only_fields = fields


class StockEntryLineSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = StockEntryLine
        fields = ['id', 'product', 'product_name', 'qty', 'cost_price', 'is_gift']


class StockEntrySerializer(serializers.ModelSerializer):
    lines = StockEntryLineSerializer(many=True, read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)

    class Meta:
        model = StockEntry
        fields = ['id', 'entry_no', 'supplier', 'supplier_name', 'date', 'attachment',
                  'payment_status', 'payment_status_display', 'total_cost', 'note',
                  'lines', 'created_at']
        read_only_fields = ['id', 'entry_no', 'total_cost', 'created_at']


class StockEntryCreateSerializer(serializers.ModelSerializer):
    lines = StockEntryLineSerializer(many=True)

    class Meta:
        model = StockEntry
        fields = ['id', 'entry_no', 'supplier', 'date', 'attachment', 'payment_status', 'note', 'lines']
        read_only_fields = ['id', 'entry_no']

    def validate_lines(self, lines):
        if not lines:
            raise serializers.ValidationError('Phiếu nhập phải có ít nhất 1 dòng.')
        return lines

    def create(self, validated_data):
        from django.utils import timezone
        lines_data = validated_data.pop('lines')
        today = timezone.now()
        prefix = f"PN-{today.strftime('%Y%m%d')}-"
        last = StockEntry.objects.filter(entry_no__startswith=prefix).order_by('-entry_no').first()
        seq = 1
        if last:
            try:
                seq = int(last.entry_no.split('-')[-1]) + 1
            except (ValueError, IndexError):
                seq = 1
        validated_data['entry_no'] = f"{prefix}{seq:03d}"
        validated_data['created_by'] = self.context['request'].user

        total_cost = 0
        with transaction.atomic():
            entry = StockEntry.objects.create(**validated_data)
            for ld in lines_data:
                product = ld['product']
                qty = ld['qty']
                line_cost = ld.get('cost_price', 0)
                is_gift = ld.get('is_gift', False)
                # Gia von binh quan gia quyen tren TONG SL nhan (gom ca hang NCC tang)
                old_stock = product.stock
                old_cost = product.cost_price
                new_stock = old_stock + qty
                if new_stock > 0:
                    new_cost = (old_stock * old_cost + qty * line_cost) / new_stock
                    product.cost_price = round(new_cost)
                product.stock = new_stock
                product.save(update_fields=['cost_price', 'stock'])
                StockEntryLine.objects.create(entry=entry, product=product, qty=qty,
                                              cost_price=line_cost, is_gift=is_gift)
                StockMovement.objects.create(product=product, change=qty, reason='nhap',
                                             ref_type='stock_entry', ref_id=entry.id,
                                             cost_at_time=line_cost,
                                             created_by=validated_data['created_by'])
                if not is_gift:
                    total_cost += qty * line_cost
            entry.total_cost = total_cost
            entry.save(update_fields=['total_cost'])
        return entry


class SupplierPaymentSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)

    class Meta:
        model = SupplierPayment
        fields = ['id', 'supplier', 'supplier_name', 'entry', 'amount', 'method', 'date', 'note', 'created_at']
        read_only_fields = ['id', 'created_at']
