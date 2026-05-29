from django.contrib import admin
from .models import ChatChannel, Message, Notification


@admin.register(ChatChannel)
class ChatChannelAdmin(admin.ModelAdmin):
    list_display = ('id', 'channel_type', 'name', 'created_by', 'created_at')
    filter_horizontal = ('members',)


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'channel', 'sender', 'message_type', 'created_at')
    list_filter = ('message_type', 'is_pinned')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'recipient', 'notif_type', 'title', 'is_read', 'created_at')
    list_filter = ('notif_type', 'is_read')
    search_fields = ('recipient__email', 'title')
