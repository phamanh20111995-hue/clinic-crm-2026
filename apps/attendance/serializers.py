from rest_framework import serializers
from django.utils import timezone
from .models import WorkShift, ShiftAssignment, AttendanceRecord, LeaveRequest


class WorkShiftSerializer(serializers.ModelSerializer):
    name_display = serializers.CharField(source='get_name_display', read_only=True)

    class Meta:
        model = WorkShift
        fields = ('id', 'name', 'name_display', 'start_time', 'end_time', 'allowed_late_minutes')


class ShiftAssignmentSerializer(serializers.ModelSerializer):
    shift_detail = WorkShiftSerializer(source='shift', read_only=True)
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = ShiftAssignment
        fields = ('id', 'user', 'user_name', 'shift', 'shift_detail', 'date')
        read_only_fields = ('id',)

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.email


class ShiftAssignmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShiftAssignment
        fields = ('user', 'shift', 'date')

    def validate(self, attrs):
        if ShiftAssignment.objects.filter(
            user=attrs['user'], shift=attrs['shift'], date=attrs['date']
        ).exists():
            raise serializers.ValidationError('Nhân viên đã được phân ca này trong ngày.')
        return attrs


class AttendanceRecordSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = (
            'id', 'user', 'user_name', 'date', 'check_in', 'check_out',
            'late_minutes', 'early_minutes', 'status', 'status_display',
            'source', 'source_display', 'manual_reason', 'created_at',
        )
        read_only_fields = ('id', 'created_at')

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.email


class ManualAttendanceSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    date = serializers.DateField()
    check_in = serializers.TimeField(required=False, allow_null=True)
    check_out = serializers.TimeField(required=False, allow_null=True)
    status = serializers.ChoiceField(choices=AttendanceRecord.STATUS_CHOICES)
    manual_reason = serializers.CharField()

    def validate(self, attrs):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if not User.objects.filter(id=attrs['user_id'], is_active=True).exists():
            raise serializers.ValidationError({'user_id': 'Nhân viên không tồn tại.'})
        return attrs


class ZKTecoSyncSerializer(serializers.Serializer):
    """
    Body gửi từ ZKTeco server / middleware:
    {
      "records": [
        {"employee_id": "EMP001", "timestamp": "2026-05-29T08:05:00", "device_id": "DEVICE_01"}
      ]
    }
    """
    records = serializers.ListField(
        child=serializers.DictField(),
        min_length=1,
    )

    def validate_records(self, records):
        required = {'employee_id', 'timestamp'}
        for i, rec in enumerate(records):
            missing = required - rec.keys()
            if missing:
                raise serializers.ValidationError(f'Record {i}: thiếu trường {missing}.')
        return records


class LeaveRequestSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    leave_type_display = serializers.CharField(source='get_leave_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    approved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = LeaveRequest
        fields = (
            'id', 'user', 'user_name', 'start_date', 'end_date',
            'leave_type', 'leave_type_display', 'reason',
            'status', 'status_display',
            'approved_by', 'approved_by_name', 'approved_at', 'reject_reason',
            'created_at',
        )
        read_only_fields = ('id', 'user', 'status', 'approved_by', 'approved_at', 'reject_reason', 'created_at')

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.email

    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return obj.approved_by.get_full_name() or obj.approved_by.email
        return None

    def validate(self, attrs):
        if attrs.get('end_date') and attrs.get('start_date'):
            if attrs['end_date'] < attrs['start_date']:
                raise serializers.ValidationError('Ngày kết thúc phải sau ngày bắt đầu.')
            if attrs['start_date'] < timezone.now().date():
                raise serializers.ValidationError('Không thể đăng ký nghỉ phép ngày đã qua.')
        return attrs

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class LeaveApproveSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs['action'] == 'reject' and not attrs.get('reason', '').strip():
            raise serializers.ValidationError({'reason': 'Vui lòng nhập lý do từ chối.'})
        return attrs
