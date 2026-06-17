from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import ChatChannel, Message, Notification

User = get_user_model()


class MemberSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'display_name', 'role')

    def get_display_name(self, obj):
        return obj.get_full_name() or obj.email


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ('id', 'channel', 'sender', 'sender_name', 'content', 'message_type',
                  'file', 'file_url', 'metadata', 'is_pinned', 'created_at')
        read_only_fields = ('id', 'sender', 'sender_name', 'file_url', 'created_at')

    def get_sender_name(self, obj):
        return obj.sender.get_full_name() or obj.sender.email if obj.sender else ''

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.file.url) if request else obj.file.url
        return None


class MessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ('content', 'message_type', 'file', 'metadata')

    def validate(self, attrs):
        msg_type = attrs.get('message_type', 'text')
        content = attrs.get('content', '').strip()
        file = attrs.get('file')
        if msg_type == 'text' and not content:
            raise serializers.ValidationError('Nội dung không được để trống.')
        if msg_type in ('file', 'image') and not file:
            raise serializers.ValidationError('Cần đính kèm file.')
        return attrs

    def create(self, validated_data):
        request = self.context['request']
        channel = self.context['channel']
        validated_data['sender'] = request.user
        validated_data['channel'] = channel
        msg = Message.objects.create(**validated_data)
        # Push via WebSocket
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(f'chat_{channel.id}', {
                'type': 'chat_message',
                'message_id': msg.id,
                'sender_id': request.user.id,
                'sender_name': request.user.get_full_name() or request.user.email,
                'content': msg.content,
                'message_type': msg.message_type,
                'metadata': msg.metadata,
                'created_at': msg.created_at.isoformat(),
            })
        return msg


class ChatChannelSerializer(serializers.ModelSerializer):
    members = MemberSerializer(many=True, read_only=True)
    admins = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatChannel
        fields = ('id', 'channel_type', 'name', 'members', 'created_by', 'admins', 'created_at',
                  'last_message', 'unread_count')
        read_only_fields = ('id', 'created_by', 'created_at')

    def get_last_message(self, obj):
        msg = obj.messages.last()
        if msg:
            return {
                'content': msg.content,
                'message_type': msg.message_type,
                'sender_name': msg.sender.get_full_name() if msg.sender else '',
                'created_at': msg.created_at.isoformat(),
            }
        return None

    def get_unread_count(self, obj):
        # Simple unread: messages not from current user with no read tracking
        # Full read tracking requires a ReadReceipt model (future sprint)
        return 0


class ChatChannelCreateSerializer(serializers.ModelSerializer):
    member_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True)

    class Meta:
        model = ChatChannel
        fields = ('channel_type', 'name', 'member_ids')

    def validate(self, attrs):
        if attrs['channel_type'] == 'direct':
            if len(attrs['member_ids']) != 1:
                raise serializers.ValidationError('Chat trực tiếp cần đúng 1 người nhận.')
        return attrs

    def create(self, validated_data):
        request = self.context['request']
        member_ids = validated_data.pop('member_ids')
        channel = ChatChannel.objects.create(created_by=request.user, **validated_data)
        member_ids.append(request.user.id)
        channel.members.set(User.objects.filter(id__in=member_ids))
        return channel


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'notif_type', 'title', 'body', 'data', 'is_read', 'created_at')
        read_only_fields = fields
