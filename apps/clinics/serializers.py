from rest_framework import serializers
from .models import Room
from django.utils import timezone


class RoomSerializer(serializers.ModelSerializer):
    clinic_name = serializers.CharField(source='clinic.name', read_only=True)
    room_type_display = serializers.CharField(source='get_room_type_display', read_only=True)
    current_appointment = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = ['id', 'clinic', 'clinic_name', 'name', 'room_type',
                  'room_type_display', 'capacity', 'is_active', 'current_appointment']

    def get_current_appointment(self, obj):
        """Lịch hẹn đang diễn ra trong phòng này hôm nay."""
        from apps.appointments.models import Appointment
        today = timezone.localdate()
        appt = Appointment.objects.filter(
            room=obj,
            scheduled_at__date=today,
            status__in=['confirmed', 'in_progress'],
        ).select_related('customer').first()
        if appt:
            return {
                'id': appt.id,
                'customer_name': appt.customer.full_name,
                'customer_phone': appt.customer.phone,
                'status': appt.status,
                'status_display': appt.get_status_display(),
                'scheduled_at': appt.scheduled_at,
            }
        return None
