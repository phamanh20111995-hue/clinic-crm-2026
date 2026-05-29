import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    ws/notifications/ — personal notification stream for authenticated user.
    Client connects with ?token=<jwt>
    Server pushes JSON: {type, title, body, data, created_at}
    """

    async def connect(self):
        if not self.scope['user'].is_authenticated:
            await self.close(code=4001)
            return
        self.user_id = self.scope['user'].id
        self.group_name = f'notifications_{self.user_id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        # Client can send {"action": "mark_read", "notification_id": 123}
        try:
            data = json.loads(text_data or '{}')
        except json.JSONDecodeError:
            return
        if data.get('action') == 'mark_read':
            notif_id = data.get('notification_id')
            if notif_id:
                await self._mark_read(notif_id)
        elif data.get('action') == 'mark_all_read':
            await self._mark_all_read()

    async def notification_message(self, event):
        await self.send(text_data=json.dumps({
            'type': event['notif_type'],
            'title': event['title'],
            'body': event.get('body', ''),
            'data': event.get('data', {}),
            'notification_id': event.get('notification_id'),
            'created_at': event.get('created_at'),
        }))

    @database_sync_to_async
    def _mark_read(self, notif_id):
        from .models import Notification
        Notification.objects.filter(id=notif_id, recipient_id=self.user_id).update(is_read=True)

    @database_sync_to_async
    def _mark_all_read(self):
        from .models import Notification
        Notification.objects.filter(recipient_id=self.user_id, is_read=False).update(is_read=True)


class ChatConsumer(AsyncWebsocketConsumer):
    """
    ws/chat/{channel_id}/ — real-time chat for a channel.
    Client sends: {"type": "message", "content": "...", "message_type": "text"}
    Server broadcasts: {type, message_id, sender_id, sender_name, content, message_type, created_at}
    """

    async def connect(self):
        if not self.scope['user'].is_authenticated:
            await self.close(code=4001)
            return
        self.channel_id = self.scope['url_route']['kwargs']['channel_id']
        self.user = self.scope['user']
        is_member = await self._check_membership()
        if not is_member:
            await self.close(code=4003)
            return
        self.group_name = f'chat_{self.channel_id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        try:
            data = json.loads(text_data or '{}')
        except json.JSONDecodeError:
            return
        msg_type = data.get('type', 'message')
        if msg_type == 'message':
            content = (data.get('content') or '').strip()
            message_type = data.get('message_type', 'text')
            metadata = data.get('metadata', {})
            if not content and message_type == 'text':
                return
            msg = await self._save_message(content, message_type, metadata)
            await self.channel_layer.group_send(self.group_name, {
                'type': 'chat_message',
                'message_id': msg.id,
                'sender_id': self.user.id,
                'sender_name': self.user.get_full_name() or self.user.email,
                'content': content,
                'message_type': message_type,
                'metadata': metadata,
                'created_at': msg.created_at.isoformat(),
            })
        elif msg_type == 'typing':
            await self.channel_layer.group_send(self.group_name, {
                'type': 'typing_indicator',
                'sender_id': self.user.id,
                'sender_name': self.user.get_full_name() or self.user.email,
                'is_typing': data.get('is_typing', False),
            })

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message_id': event['message_id'],
            'sender_id': event['sender_id'],
            'sender_name': event['sender_name'],
            'content': event['content'],
            'message_type': event['message_type'],
            'metadata': event.get('metadata', {}),
            'created_at': event['created_at'],
        }))

    async def typing_indicator(self, event):
        if event['sender_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'typing',
                'sender_id': event['sender_id'],
                'sender_name': event['sender_name'],
                'is_typing': event['is_typing'],
            }))

    @database_sync_to_async
    def _check_membership(self):
        from .models import ChatChannel
        return ChatChannel.objects.filter(id=self.channel_id, members=self.user).exists()

    @database_sync_to_async
    def _save_message(self, content, message_type, metadata):
        from .models import Message
        return Message.objects.create(
            channel_id=self.channel_id,
            sender=self.user,
            content=content,
            message_type=message_type,
            metadata=metadata,
        )
