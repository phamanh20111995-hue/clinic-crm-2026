from rest_framework import serializers
from django.utils import timezone
from .models import Appointment
from apps.customers.serializers import CustomerListSerializer


class AppointmentListSerializer(serializers.ModelSerializer):
    customer_name      = serializers.CharField(source='customer.full_name', read_only=True)
    customer_phone     = serializers.CharField(source='customer.phone', read_only=True)
    status_display     = serializers.CharField(source='get_status_display', read_only=True)
    visit_type_display = serializers.CharField(source='get_visit_type_display', read_only=True)
    service_name       = serializers.CharField(source='service.name', read_only=True)
    room_name          = serializers.CharField(source='room.name', read_only=True)
    booked_by_name     = serializers.CharField(source='booked_by.display_name', read_only=True)
    doctor_name        = serializers.CharField(source='doctor.display_name', read_only=True)
    ktv_name           = serializers.CharField(source='ktv.display_name', read_only=True)
    sale_name          = serializers.CharField(source='sale.display_name', read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id', 'customer', 'customer_name', 'customer_phone',
            'scheduled_at', 'service', 'service_name',
            'status', 'status_display',
            'visit_type', 'visit_type_display',
            'room', 'room_name',
            'doctor', 'doctor_name',
            'ktv', 'ktv_name',
            'sale', 'sale_name',
            'booked_by_name', 'is_walkin', 'tua_confirmed',
            'tua_confirmed_via_zalo', 'notes',
            'checked_out_at', 'created_at',
        ]


class AppointmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = [
            'customer', 'scheduled_at', 'service', 'notes',
            'visit_type', 'room', 'doctor', 'ktv', 'sale',
        ]

    def validate_scheduled_at(self, value):
        if value < timezone.now():
            raise serializers.ValidationError('Không thể đặt lịch trong quá khứ.')
        return value

    def create(self, validated_data):
        validated_data['booked_by'] = self.context['request'].user
        return super().create(validated_data)


class AppointmentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = [
            'scheduled_at', 'service', 'status', 'visit_type',
            'room', 'doctor', 'ktv', 'sale', 'notes',
        ]


# Status automatically set based on visit_type when assigning a room
VISIT_TYPE_STATUS_MAP = {
    'dieu_tri':  'in_progress',
    'tu_van':    'consulting',
    'tai_kham':  'consulting',
    'khieu_nai': 'consulting',
}


class AssignRoomSerializer(serializers.ModelSerializer):
    """
    Used by the assign-room endpoint.
    Accepts room, doctor, ktv, sale, visit_type.
    Automatically derives status from visit_type.
    """
    class Meta:
        model = Appointment
        fields = ['room', 'doctor', 'ktv', 'sale', 'visit_type']

    def update(self, instance, validated_data):
        visit_type = validated_data.get('visit_type', instance.visit_type)
        validated_data['status'] = VISIT_TYPE_STATUS_MAP.get(visit_type, 'consulting')
        return super().update(instance, validated_data)


class WalkInSerializer(serializers.Serializer):
    """Tạo KH walk-in + lịch hẹn cùng lúc."""
    full_name  = serializers.CharField(max_length=200)
    phone      = serializers.CharField(max_length=15)
    gender     = serializers.ChoiceField(choices=[('M', 'Nam'), ('F', 'Nữ')], required=False, allow_blank=True)
    service    = serializers.PrimaryKeyRelatedField(
        queryset=__import__('apps.services.models', fromlist=['Service']).Service.objects.filter(is_active=True),
        required=False, allow_null=True,
    )
    room = serializers.PrimaryKeyRelatedField(
        queryset=__import__('apps.clinics.models', fromlist=['Room']).Room.objects.filter(is_active=True),
        required=False, allow_null=True,
    )
    visit_type = serializers.ChoiceField(
        choices=Appointment.VISIT_TYPE_CHOICES, default='tu_van', required=False,
    )
    notes = serializers.CharField(required=False, allow_blank=True)
