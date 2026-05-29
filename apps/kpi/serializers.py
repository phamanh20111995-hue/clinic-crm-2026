from rest_framework import serializers
from .models import KPITarget, KPIRecord


class KPITargetSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = KPITarget
        fields = ('id', 'user', 'user_name', 'month', 'year',
                  'calls_target', 'appointments_target', 'revenue_target', 'contracts_target')

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.email


class KPIRecordSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_role = serializers.CharField(source='user.role', read_only=True)
    calls_pct = serializers.SerializerMethodField()
    appointments_pct = serializers.SerializerMethodField()
    revenue_pct = serializers.SerializerMethodField()
    contracts_pct = serializers.SerializerMethodField()

    class Meta:
        model = KPIRecord
        fields = (
            'id', 'user', 'user_name', 'user_role', 'month', 'year',
            'calls_target', 'calls_actual', 'calls_pct',
            'appointments_target', 'appointments_actual', 'appointments_pct',
            'revenue_target', 'revenue_actual', 'revenue_pct',
            'contracts_target', 'contracts_actual', 'contracts_pct',
            'tua_count', 'achievement_rate', 'updated_at',
        )

    def _pct(self, target, actual):
        if not target:
            return None
        return round(actual / target * 100, 1)

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.email

    def get_calls_pct(self, obj):
        return self._pct(obj.calls_target, obj.calls_actual)

    def get_appointments_pct(self, obj):
        return self._pct(obj.appointments_target, obj.appointments_actual)

    def get_revenue_pct(self, obj):
        return self._pct(float(obj.revenue_target), float(obj.revenue_actual))

    def get_contracts_pct(self, obj):
        return self._pct(obj.contracts_target, obj.contracts_actual)
