from rest_framework import serializers
from .models import Contract


class ContractItemSerializer(serializers.Serializer):
    """Dịch vụ trong HĐ — lưu vào JSONField items."""
    service_id = serializers.IntegerField(required=False, allow_null=True)
    name = serializers.CharField(max_length=200)
    sessions = serializers.IntegerField(min_value=1, default=1)
    price = serializers.DecimalField(max_digits=15, decimal_places=0)
    discount = serializers.DecimalField(max_digits=15, decimal_places=0, default=0)

    def validate(self, attrs):
        if attrs.get('discount', 0) > attrs['price']:
            raise serializers.ValidationError('Chiết khấu không được vượt giá dịch vụ.')
        return attrs


class ContractListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    created_by_name = serializers.CharField(source='created_by.display_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.display_name', read_only=True)
    approval_status_display = serializers.CharField(source='get_approval_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)

    class Meta:
        model = Contract
        fields = [
            'id', 'contract_no', 'customer', 'customer_name', 'customer_phone',
            'total_amount', 'discount_amount', 'final_amount',
            'payment_method', 'payment_method_display',
            'cash_amount', 'transfer_amount',
            'payment_status', 'payment_status_display',
            'approval_status', 'approval_status_display',
            'created_by_name', 'approved_by_name', 'approved_at',
            'created_at',
        ]


class ContractDetailSerializer(ContractListSerializer):
    items_detail = serializers.JSONField(source='items', read_only=True)
    promotions_detail = serializers.JSONField(source='promotions', read_only=True)
    gifts_detail = serializers.JSONField(source='gifts', read_only=True)

    class Meta(ContractListSerializer.Meta):
        fields = ContractListSerializer.Meta.fields + [
            'appointment', 'items_detail', 'promotions_detail', 'gifts_detail', 'notes',
        ]


class ContractCreateSerializer(serializers.ModelSerializer):
    """Tạo HĐ nháp — Sale/CSKH."""
    items = serializers.ListField(child=serializers.DictField(), min_length=1)
    promotions = serializers.ListField(child=serializers.DictField(), required=False, default=list)
    gifts = serializers.ListField(child=serializers.DictField(), required=False, default=list)

    class Meta:
        model = Contract
        fields = [
            'id', 'contract_no',
            'customer', 'appointment', 'items', 'promotions', 'gifts',
            'total_amount', 'discount_amount', 'final_amount', 'sale_round', 'so_buoi',
            'payment_method', 'cash_amount', 'transfer_amount', 'notes',
        ]
        read_only_fields = ['id', 'contract_no']

    def validate(self, attrs):
        pm = attrs.get('payment_method')
        if pm == 'cash' and attrs.get('transfer_amount', 0) > 0:
            raise serializers.ValidationError('Thanh toán tiền mặt không có chuyển khoản.')
        if pm == 'transfer' and attrs.get('cash_amount', 0) > 0:
            raise serializers.ValidationError('Thanh toán CK không có tiền mặt.')
        if pm == 'combined':
            total = attrs.get('cash_amount', 0) + attrs.get('transfer_amount', 0)
            if total != attrs.get('final_amount', 0):
                raise serializers.ValidationError('Tiền mặt + CK phải bằng tổng thanh toán.')
        return attrs

    def validate_customer(self, customer):
        user = self.context['request'].user
        # SALE chỉ tạo HĐ cho KH của mình
        if user.role == 'SALE' and customer.sale_id != user.id:
            raise serializers.ValidationError('Bạn chỉ tạo HĐ cho KH do mình phụ trách.')
        return customer

    def create(self, validated_data):
        # Auto-generate contract_no: HĐ-YYYY-NNN
        from django.utils import timezone
        year = timezone.now().year
        last = Contract.objects.filter(contract_no__startswith=f'HĐ-{year}-').order_by('-contract_no').first()
        if last:
            try:
                seq = int(last.contract_no.split('-')[-1]) + 1
            except (ValueError, IndexError):
                seq = 1
        else:
            seq = 1
        validated_data['contract_no'] = f'HĐ-{year}-{seq:04d}'
        validated_data['created_by'] = self.context['request'].user
        validated_data['approval_status'] = 'draft'
        return super().create(validated_data)


class ContractUpdateSerializer(serializers.ModelSerializer):
    """Cập nhật HĐ nháp (chỉ khi draft)."""
    class Meta:
        model = Contract
        fields = [
            'items', 'promotions', 'gifts',
            'total_amount', 'discount_amount', 'final_amount', 'sale_round', 'so_buoi',
            'payment_method', 'cash_amount', 'transfer_amount', 'notes',
        ]
        read_only_fields = ['id', 'contract_no']

    def validate(self, attrs):
        if self.instance and self.instance.approval_status != 'draft':
            raise serializers.ValidationError('Chỉ cập nhật được HĐ ở trạng thái Nháp.')
        return attrs

from .models import TreatmentCourse, TreatmentSession


class TreatmentSessionSerializer(serializers.ModelSerializer):
    ktv_name = serializers.CharField(source='ktv.display_name', read_only=True)

    class Meta:
        model = TreatmentSession
        fields = ['id', 'course', 'appointment', 'date', 'ktv', 'ktv_name', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at']


class TreatmentCourseSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.name', read_only=True)
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    so_buoi_da_dung = serializers.IntegerField(read_only=True)
    buoi_con_lai = serializers.IntegerField(read_only=True)
    sessions = TreatmentSessionSerializer(many=True, read_only=True)

    class Meta:
        model = TreatmentCourse
        fields = ['id', 'contract', 'customer', 'customer_name', 'service', 'service_name',
                  'so_buoi', 'so_buoi_da_dung', 'buoi_con_lai', 'note', 'sessions', 'created_at']
        read_only_fields = ['id', 'created_at']
