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
