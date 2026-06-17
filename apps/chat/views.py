from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import ChatChannel, Message, Notification
from .serializers import (
    ChatChannelSerializer, ChatChannelCreateSerializer,
    MessageSerializer, MessageCreateSerializer, NotificationSerializer,
)


class ChannelListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChatChannel.objects.filter(members=self.request.user).prefetch_related('members', 'messages')

    def get_serializer_class(self):
        return ChatChannelCreateSerializer if self.request.method == 'POST' else ChatChannelSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        channel = serializer.save()
        return Response(ChatChannelSerializer(channel, context={'request': request}).data,
                        status=status.HTTP_201_CREATED)


class ChannelDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ChatChannelSerializer

    def get_queryset(self):
        return ChatChannel.objects.filter(members=self.request.user)


class MessageListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_channel(self):
        channel = get_object_or_404(ChatChannel, pk=self.kwargs['channel_id'], members=self.request.user)
        return channel

    def get_queryset(self):
        channel = self.get_channel()
        return Message.objects.filter(channel=channel).select_related('sender').order_by('created_at')

    def get_serializer_class(self):
        return MessageCreateSerializer if self.request.method == 'POST' else MessageSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        ctx['channel'] = self.get_channel()
        return ctx

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        msg = serializer.save()
        return Response(MessageSerializer(msg, context={'request': request}).data,
                        status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pin_message(request, message_id):
    msg = get_object_or_404(Message, pk=message_id, channel__members=request.user)
    msg.is_pinned = not msg.is_pinned
    msg.save(update_fields=['is_pinned'])
    return Response({'is_pinned': msg.is_pinned})


class NotificationListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        qs = Notification.objects.filter(recipient=self.request.user)
        unread_only = self.request.query_params.get('unread')
        if unread_only == '1':
            qs = qs.filter(is_read=False)
        return qs


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, pk):
    notif = get_object_or_404(Notification, pk=pk, recipient=request.user)
    notif.is_read = True
    notif.save(update_fields=['is_read'])
    return Response({'status': 'ok'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
    return Response({'status': 'ok'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_or_create_direct(request):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    user_id = request.data.get('user_id')
    if not user_id:
        return Response({'detail': 'Thiếu user_id.'}, status=status.HTTP_400_BAD_REQUEST)
    target = User.objects.filter(pk=user_id, is_active=True).first()
    if not target:
        return Response({'detail': 'Không tìm thấy user.'}, status=status.HTTP_404_NOT_FOUND)
    if target == request.user:
        return Response({'detail': 'Không thể chat với chính mình.'}, status=status.HTTP_400_BAD_REQUEST)

    from django.db.models import Count
    channel = (
        ChatChannel.objects
        .filter(channel_type='direct', members=request.user)
        .filter(members=target)
        .annotate(member_count=Count('members'))
        .filter(member_count=2)
        .first()
    )
    if not channel:
        channel = ChatChannel.objects.create(channel_type='direct', created_by=request.user)
        channel.members.set([request.user, target])

    return Response(ChatChannelSerializer(channel, context={'request': request}).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_members(request, pk):
    channel = get_object_or_404(ChatChannel, pk=pk, members=request.user)
    if channel.channel_type != 'group':
        return Response({'detail': 'Chỉ thêm thành viên vào nhóm.'}, status=status.HTTP_400_BAD_REQUEST)
    if request.user != channel.created_by and request.user.role not in ('QUAN_LY', 'CHU_DN'):
        return Response({'detail': 'Không có quyền thêm thành viên.'}, status=status.HTTP_403_FORBIDDEN)

    from django.contrib.auth import get_user_model
    User = get_user_model()
    user_ids = request.data.get('user_ids', [])
    if not user_ids:
        return Response({'detail': 'Thiếu user_ids.'}, status=status.HTTP_400_BAD_REQUEST)
    new_users = User.objects.filter(pk__in=user_ids, is_active=True)
    channel.members.add(*new_users)
    return Response(ChatChannelSerializer(channel, context={'request': request}).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_channel(request, pk):
    channel = get_object_or_404(ChatChannel, pk=pk, members=request.user)
    if channel.channel_type != 'group':
        return Response({'detail': 'Không thể rời kênh trực tiếp.'}, status=status.HTTP_400_BAD_REQUEST)
    channel.members.remove(request.user)
    return Response({'detail': 'Đã rời nhóm.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_member(request, pk):
    channel = get_object_or_404(ChatChannel, pk=pk, members=request.user)
    if channel.channel_type != 'group':
        return Response({'detail': 'Chỉ xóa thành viên khỏi nhóm.'}, status=status.HTTP_400_BAD_REQUEST)
    if request.user != channel.created_by and request.user.role not in ('QUAN_LY', 'CHU_DN'):
        return Response({'detail': 'Không có quyền xóa thành viên.'}, status=status.HTTP_403_FORBIDDEN)

    user_id = request.data.get('user_id')
    if not user_id:
        return Response({'detail': 'Thiếu user_id.'}, status=status.HTTP_400_BAD_REQUEST)
    if user_id == request.user.id:
        return Response({'detail': 'Dùng endpoint leave để tự rời.'}, status=status.HTTP_400_BAD_REQUEST)
    channel.members.remove(user_id)
    return Response(ChatChannelSerializer(channel, context={'request': request}).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def disband_channel(request, pk):
    channel = get_object_or_404(ChatChannel, pk=pk, members=request.user)
    if channel.channel_type != 'group':
        return Response({'detail': 'Không thể giải tán kênh trực tiếp.'}, status=status.HTTP_400_BAD_REQUEST)
    if request.user != channel.created_by and request.user.role not in ('QUAN_LY', 'CHU_DN'):
        return Response({'detail': 'Chỉ trưởng nhóm mới giải tán được nhóm.'}, status=status.HTTP_403_FORBIDDEN)
    channel.delete()
    return Response({'detail': 'Đã giải tán nhóm.'})
