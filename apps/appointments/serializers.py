from rest_framework import serializers
from django.utils import timezone
from .models import Appointment
from apps.customers.serializers import CustomerListSerializer


class AppointmentListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    room_name = serializers.CharField(source='room.name', read_only=True)
    booked_by_name = serializers.CharField(source='booked_by.display_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.display_name', read_only=True)
    ktv_name = serializers.CharField(source='ktv.display_name', read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id', 'customer', 'customer_name', 'customer_phone',
            'scheduled_at', 'service', 'service_name',
            'status', 'status_display', 'room', 'room_name',
            'doctor', 'doctor_name', 'ktv', 'ktv_name',
            'booked_by_name', 'is_walkin', 'tua_confirmed',
            'tua_confirmed_via_zalo', 'notes', 'created_at',
        ]


class AppointmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = [
            'customer', 'scheduled_at', 'service', 'notes',
            'room', 'doctor', 'ktv',
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
        fields = ['scheduled_at', 'service', 'status', 'room', 'doctor', 'ktv', 'notes']


class WalkInSerializer(serializers.Serializer):
    """Tạo KH walk-in + lịch hẹn cùng lúc."""
    # Thông tin KH
    full_name = serializers.CharField(max_length=200)
    phone = serializers.CharField(max_length=15)
    gender = serializers.ChoiceField(choices=[('M', 'Nam'), ('F', 'Nữ')], required=False, allow_blank=True)
    # Thông tin lịch hẹn
    service = serializers.PrimaryKeyRelatedField(
        queryset=__import__('apps.services.models', fromlist=['Service']).Service.objects.filter(is_active=True),
        required=False, allow_null=True,
    )
    room = serializers.PrimaryKeyRelatedField(
        queryset=__import__('apps.clinics.models', fromlist=['Room']).Room.objects.filter(is_active=True),
        required=False, allow_null=True,
    )
    notes = serializers.CharField(required=False, allow_blank=True)


class AssignRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ['room']
