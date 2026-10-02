from rest_framework import serializers
from django.utils import timezone
from .models import Customer, CustomerImage, CallHistory, ReturnRequest


class CustomerImageSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.display_name', read_only=True)
    class Meta:
        model = CustomerImage
        fields = ['id','image','image_type','uploaded_by_name','uploaded_at','notes']
        read_only_fields = ['id','uploaded_at','uploaded_by_name']


class CallHistorySerializer(serializers.ModelSerializer):
    tele_name = serializers.CharField(source='tele.display_name', read_only=True)
    result_display = serializers.CharField(source='get_result_display', read_only=True)
    class Meta:
        model = CallHistory
        fields = ['id','call_number','result','result_display','consult_result','notes',
                  'recording_file','called_at','tele_name']
        read_only_fields = ['id','called_at','tele_name']


class ReturnRequestSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.CharField(source='requested_by.display_name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.display_name', read_only=True)
    reason_type_display = serializers.CharField(source='get_reason_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    class Meta:
        model = ReturnRequest
        fields = ['id','customer','customer_name','customer_phone','reason','reason_type',
                  'reason_type_display','recording_file','status','status_display',
                  'requested_by_name','reviewed_by_name','reviewed_at','created_at']
        read_only_fields = ['id','status','requested_by_name','reviewed_by_name','reviewed_at','created_at']


def _last_done_appt(obj):
    return obj.appointments.filter(status='done').order_by('-scheduled_at').first()


class CustomerListSerializer(serializers.ModelSerializer):
    """Danh sách — ít field, hiệu năng cao."""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    data_type_display = serializers.CharField(source='get_data_type_display', read_only=True)
    tele_name = serializers.CharField(source='tele.display_name', read_only=True)
    sale_name = serializers.CharField(source='sale.display_name', read_only=True)
    cskh_name = serializers.CharField(source='cskh.display_name', read_only=True)
    ads_name = serializers.CharField(source='ads.display_name', read_only=True)
    last_bs_name = serializers.SerializerMethodField()
    last_ktv_name = serializers.SerializerMethodField()
    services_interest_names = serializers.SerializerMethodField()
    round1_value = serializers.SerializerMethodField()
    round1_paid = serializers.SerializerMethodField()
    round1_debt = serializers.SerializerMethodField()
    total_value = serializers.SerializerMethodField()
    total_paid = serializers.SerializerMethodField()
    total_debt = serializers.SerializerMethodField()
    upsale_value = serializers.SerializerMethodField()
    hd_status = serializers.SerializerMethodField()
    so_buoi_total = serializers.SerializerMethodField()
    buoi_con_lai = serializers.SerializerMethodField()
    next_appt = serializers.SerializerMethodField()
    class Meta:
        model = Customer
        fields = ['id','full_name','phone','gender','source','source_display',
                  'data_type','data_type_display','status','status_display',
                  'call_count','customer_group','appointment_date','province',
                  'tele_name','sale_name','cskh','cskh_name','ads','ads_name',
                  'last_bs_name','last_ktv_name','services_interest_names','round1_value','round1_paid','round1_debt',
                  'total_value','total_paid','total_debt','upsale_value',
                  'so_buoi_total','buoi_con_lai','next_appt','hd_status','created_at']

    def get_next_appt(self, obj):
        from django.utils import timezone
        today = timezone.localdate()
        upcoming = (obj.appointments
                    .filter(scheduled_at__date__gte=today)
                    .exclude(status='cancelled')
                    .order_by('scheduled_at').first())
        past = (obj.appointments
                .filter(scheduled_at__date__lt=today)
                .exclude(status='cancelled')
                .order_by('-scheduled_at').first())
        appt = upcoming or past
        if not appt:
            return None
        local = timezone.localtime(appt.scheduled_at)
        return {'id': appt.id, 'date': local.strftime('%Y-%m-%d'), 'time': local.strftime('%H:%M'), 'is_past': appt.scheduled_at.date() < today}

    def get_last_bs_name(self, obj):
        appt = _last_done_appt(obj)
        return appt.doctor.display_name if appt and appt.doctor else None

    def get_last_ktv_name(self, obj):
        appt = _last_done_appt(obj)
        return appt.ktv.display_name if appt and appt.ktv else None

    def get_services_interest_names(self, obj):
        return [s.name for s in obj.services_interest.all()]

    def _round1_contracts(self, obj):
        return obj.contracts.filter(sale_round='sale')

    def get_round1_value(self, obj):
        return sum(float(c.final_amount or 0) for c in self._round1_contracts(obj))

    def get_round1_paid(self, obj):
        return sum(float(c.cash_amount or 0) + float(c.transfer_amount or 0) for c in self._round1_contracts(obj))

    def get_round1_debt(self, obj):
        return self.get_round1_value(obj) - self.get_round1_paid(obj)

    def _all_contracts(self, obj):
        return obj.contracts.all()

    def get_total_value(self, obj):
        return sum(float(c.final_amount or 0) for c in self._all_contracts(obj))

    def get_total_paid(self, obj):
        return sum(float(c.cash_amount or 0) + float(c.transfer_amount or 0) for c in self._all_contracts(obj))

    def get_total_debt(self, obj):
        return self.get_total_value(obj) - self.get_total_paid(obj)

    def get_upsale_value(self, obj):
        return sum(float(c.final_amount or 0) for c in obj.contracts.filter(sale_round='upsale'))

    def get_so_buoi_total(self, obj):
        return sum(int(c.so_buoi or 0) for c in self._all_contracts(obj))

    def get_buoi_con_lai(self, obj):
        total = self.get_so_buoi_total(obj)
        da_dung = obj.appointments.filter(status='done').count() if hasattr(obj, 'appointments') else 0
        return max(0, total - da_dung)

    def get_hd_status(self, obj):
        contracts = [c for c in obj.contracts.all() if not c.is_deleted]
        if not contracts:
            return {'latest': None, 'pending_count': 0}
        latest = sorted(contracts, key=lambda c: c.created_at, reverse=True)[0]
        pending_count = sum(1 for c in contracts if c.approval_status in ('draft', 'pending_kt'))
        return {'latest': latest.approval_status, 'pending_count': pending_count}

class CustomerDetailSerializer(serializers.ModelSerializer):
    """Chi tiết — full 5 tab."""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    data_type_display = serializers.CharField(source='get_data_type_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.display_name', read_only=True)
    tele_name = serializers.CharField(source='tele.display_name', read_only=True)
    sale_name = serializers.CharField(source='sale.display_name', read_only=True)
    cskh_name = serializers.CharField(source='cskh.display_name', read_only=True)
    ads_name = serializers.CharField(source='ads.display_name', read_only=True)
    last_bs_name = serializers.SerializerMethodField()
    last_ktv_name = serializers.SerializerMethodField()
    services_interest_names = serializers.SerializerMethodField()
    calls = CallHistorySerializer(many=True, read_only=True)
    images = CustomerImageSerializer(many=True, read_only=True)
    class Meta:
        model = Customer
        fields = ['id','full_name','phone','dob','gender','address',
                  'source','source_display','data_type','data_type_display',
                  'status','status_display','call_count',
                  'customer_group','appointment_date','province','notes',
                  'tele','tele_name','sale','sale_name','cskh','cskh_name','ads','ads_name',
                  'last_bs_name','last_ktv_name',
                  'services_interest','services_interest_names',
                  'created_by_name','created_at','updated_at',
                  'calls','images']
        read_only_fields = ['id','call_count','created_by_name','created_at','updated_at']

    def get_last_bs_name(self, obj):
        appt = _last_done_appt(obj)
        return appt.doctor.display_name if appt and appt.doctor else None

    def get_last_ktv_name(self, obj):
        appt = _last_done_appt(obj)
        return appt.ktv.display_name if appt and appt.ktv else None

    def get_services_interest_names(self, obj):
        return [s.name for s in obj.services_interest.all()]


class CustomerCreateSerializer(serializers.ModelSerializer):
    appointment_time = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = Customer
        fields = ['full_name','phone','dob','gender','address','source','data_type','status',
                  'customer_group','appointment_date','province','notes','tele','sale','cskh','ads',
                  'services_interest','appointment_time']

    def validate_phone(self, value):
        # Kiểm tra trùng SĐT (CLAUDE.md)
        qs = Customer.objects.filter(phone=value, is_deleted=False)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('Số điện thoại đã tồn tại trong hệ thống.')
        return value

    def _sync_appointment(self, customer, appt_time_str):
        import datetime
        from apps.appointments.models import Appointment

        appt_date = customer.appointment_date
        if not appt_date:
            return

        # Parse giờ, mặc định 09:00 nếu rỗng/sai
        hour, minute = 9, 0
        if appt_time_str:
            try:
                parts = appt_time_str.strip().split(':')
                hour = int(parts[0])
                minute = int(parts[1]) if len(parts) > 1 else 0
            except (ValueError, IndexError):
                hour, minute = 9, 0

        # Dựng aware datetime theo timezone VN
        naive_dt = datetime.datetime.combine(appt_date, datetime.time(hour, minute))
        scheduled_at = timezone.make_aware(naive_dt, timezone.get_current_timezone())

        # Tìm lịch sắp tới chưa kết thúc
        existing = (
            Appointment.objects
            .filter(customer=customer, scheduled_at__date__gte=timezone.localdate())
            .exclude(status__in=['done', 'cancelled'])
            .order_by('scheduled_at')
            .first()
        )

        if existing:
            existing.scheduled_at = scheduled_at
            existing.save(update_fields=['scheduled_at'])
        else:
            Appointment.objects.create(
                customer=customer,
                scheduled_at=scheduled_at,
                booked_by=self.context['request'].user,
                status='pending',
            )

    def create(self, validated_data):
        appt_time = validated_data.pop('appointment_time', '')
        validated_data['created_by'] = self.context['request'].user
        customer = super().create(validated_data)
        self._sync_appointment(customer, appt_time)
        return customer

    def update(self, instance, validated_data):
        appt_time = validated_data.pop('appointment_time', '')
        customer = super().update(instance, validated_data)
        self._sync_appointment(customer, appt_time)
        return customer


class CustomerAssignSerializer(serializers.ModelSerializer):
    """Phân công Tele / Sale."""
    class Meta:
        model = Customer
        fields = ['tele','sale']


class CustomerCskhAssignSerializer(serializers.ModelSerializer):
    """Phân công CSKH."""
    class Meta:
        model = Customer
        fields = ['cskh']
