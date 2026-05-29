from rest_framework import serializers
from .models import SalaryConfig, MonthlySalary


class SalaryConfigSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = SalaryConfig
        fields = ('id', 'user', 'user_name', 'base_salary', 'commission_rate',
                  'tua_rate', 'late_deduct_per_minute', 'absent_deduct_per_day')

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.email


class MonthlySalarySerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_role = serializers.CharField(source='user.role', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    approved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = MonthlySalary
        fields = (
            'id', 'user', 'user_name', 'user_role',
            'month', 'year',
            'working_days', 'actual_days', 'late_minutes_total', 'absent_days',
            'base', 'commission', 'tua_income', 'deductions', 'bonus', 'total',
            'status', 'status_display',
            'approved_by', 'approved_by_name', 'approved_at',
            'notes', 'created_at',
        )
        read_only_fields = fields

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.email

    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return obj.approved_by.get_full_name() or obj.approved_by.email
        return None


class SalaryCalculateSerializer(serializers.Serializer):
    month = serializers.IntegerField(min_value=1, max_value=12)
    year = serializers.IntegerField(min_value=2020, max_value=2100)
    user_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text='Để trống = tính cho tất cả nhân viên có SalaryConfig',
    )
    overwrite = serializers.BooleanField(default=False,
                                         help_text='True = tính lại nếu đã tồn tại bản nháp')


class SalaryApproveSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'pay'])
    notes = serializers.CharField(required=False, allow_blank=True)
