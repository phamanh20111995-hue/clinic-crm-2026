from rest_framework import serializers
from .models import ZaloConfig, ZaloUserBinding, ZaloMessageLog


class ZaloConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ZaloConfig
        fields = ('id', 'oa_id', 'token_expires_at', 'updated_at')
        read_only_fields = fields


class ZaloUserBindingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ZaloUserBinding
        fields = ('id', 'zalo_user_id', 'display_name', 'avatar_url', 'user', 'customer', 'created_at')
        read_only_fields = fields


class ZaloMessageLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ZaloMessageLog
        fields = ('id', 'zalo_user_id', 'direction', 'msg_type', 'content',
                  'status', 'error', 'related_appointment_id', 'created_at')
        read_only_fields = fields
