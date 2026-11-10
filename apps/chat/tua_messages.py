"""Tin nhắn tua trong 'cuộc trò chuyện với Hệ thống' của từng nhân viên.
- post_tua_message: gửi 1 tin tua (có nút Đồng ý/Từ chối) khi được chia tua.
- update_tua_message_status: cập nhật trạng thái tin sau khi người nhận đồng ý/từ chối.
- recall_tua_message: thu hồi tin (lễ tân chia sai → chia lại) như Zalo (is_recalled).
Tin tua = Message(message_type='system', metadata={'kind':'tua', 'tua_id':...}), sender=None (Hệ thống)."""


def _ws_push(channel_id, event):
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        cl = get_channel_layer()
        if cl:
            async_to_sync(cl.group_send)(f'chat_{channel_id}', event)
    except Exception:
        pass


def get_system_channel(user):
    """Lấy/ tạo kênh 'Hệ thống' (direct, chỉ gồm chính user) để nhắn tua."""
    from .models import ChatChannel
    ch = ChatChannel.objects.filter(channel_type='direct', name='Hệ thống', members=user).first()
    if ch is None:
        ch = ChatChannel.objects.create(channel_type='direct', name='Hệ thống', created_by=None)
        ch.members.set([user])
    return ch


def _khach(alloc):
    try:
        appt = alloc.appointment
        return (appt.customer.full_name if appt and appt.customer_id else '') or ''
    except Exception:
        return ''


def post_tua_message(alloc):
    """Đăng tin tua vào kênh Hệ thống của người nhận. Trả về Message hoặc None."""
    from .models import Message
    if not alloc.user_id:
        return None
    ch = get_system_channel(alloc.user)
    khach = _khach(alloc)
    # CHỈ Kế toán thấy tiền tua — tin cho nhân viên KHÔNG kèm số tiền
    content = f'Bạn được chia tua {alloc.get_role_display()} buổi "{khach}". Vui lòng xác nhận.'
    meta = {
        'kind': 'tua', 'tua_id': alloc.id, 'role': alloc.role, 'role_display': alloc.get_role_display(),
        'customer': khach, 'service': alloc.service_name or '',
        'status': alloc.status,
    }
    msg = Message.objects.create(channel=ch, sender=None, content=content, message_type='system', metadata=meta)
    _ws_push(ch.id, {
        'type': 'chat_message', 'message_id': msg.id, 'sender_id': None, 'sender_name': 'Hệ thống',
        'content': content, 'message_type': 'system', 'metadata': meta, 'created_at': msg.created_at.isoformat(),
    })
    return msg


def _find_tua_messages(alloc_id):
    from .models import Message
    try:
        return list(Message.objects.filter(message_type='system', metadata__tua_id=alloc_id))
    except Exception:
        # Phòng khi JSON lookup không khả dụng — lọc bằng Python
        return [m for m in Message.objects.filter(message_type='system') if (m.metadata or {}).get('tua_id') == alloc_id]


def update_tua_message_status(alloc):
    """Cập nhật trạng thái tin tua sau khi người nhận đồng ý/từ chối."""
    for msg in _find_tua_messages(alloc.id):
        meta = dict(msg.metadata or {})
        meta['status'] = alloc.status
        meta['reject_reason'] = alloc.reject_reason or '' if alloc.status == 'tu_choi' else ''
        msg.metadata = meta
        msg.save(update_fields=['metadata'])


def recall_tua_message(alloc):
    """Thu hồi tin tua (chia sai → chia lại) như Zalo."""
    from .models import Message
    for msg in _find_tua_messages(alloc.id):
        if msg.is_recalled:
            continue
        msg.is_recalled = True
        msg.save(update_fields=['is_recalled'])
        _ws_push(msg.channel_id, {'type': 'chat_message_recalled', 'message_id': msg.id})


# ── Kênh giám sát chung cho QL / Chủ DN / Kế toán ──────────────────────────────
OVERSIGHT_ROLES = ('QUAN_LY', 'CHU_DN', 'KE_TOAN')
OVERSIGHT_NAME = 'Chia tua (Giám sát)'


def get_oversight_channel():
    """Lấy/ tạo kênh nhóm 'Chia tua (Giám sát)'; thành viên = QL/Chủ DN/Kế toán hiện tại."""
    from .models import ChatChannel
    from django.contrib.auth import get_user_model
    User = get_user_model()
    mgr_ids = set(User.objects.filter(role__in=OVERSIGHT_ROLES, is_active=True).values_list('id', flat=True))
    ch = ChatChannel.objects.filter(channel_type='group', name=OVERSIGHT_NAME).first()
    if ch is None:
        ch = ChatChannel.objects.create(channel_type='group', name=OVERSIGHT_NAME, created_by=None)
        ch.members.set(mgr_ids)
    else:
        cur = set(ch.members.values_list('id', flat=True))
        if cur != mgr_ids:
            ch.members.set(mgr_ids)
    return ch


def post_oversight_log(content):
    """Đăng 1 dòng log (không nút) vào kênh giám sát + WS push."""
    from .models import Message
    ch = get_oversight_channel()
    meta = {'kind': 'tua_log'}
    msg = Message.objects.create(channel=ch, sender=None, content=content, message_type='system', metadata=meta)
    _ws_push(ch.id, {
        'type': 'chat_message', 'message_id': msg.id, 'sender_id': None, 'sender_name': 'Hệ thống',
        'content': content, 'message_type': 'system', 'metadata': meta, 'created_at': msg.created_at.isoformat(),
    })
    return msg


def log_tua(alloc, event, reason=''):
    """Ghi nhật ký 1 sự kiện tua vào kênh giám sát. event: chia|xac_nhan|tu_choi|thu_hoi."""
    try:
        who = (alloc.user.get_full_name() or alloc.user.email) if alloc.user_id else '—'
        role = alloc.get_role_display()
        khach = _khach(alloc)
        # Kênh giám sát KHÔNG hiện tiền (QL/CDN cũng xem) — tiền chỉ ở màn Kế toán
        if event == 'chia':
            txt = f'🟡 Chia tua {role} buổi "{khach}" cho {who} · chờ xác nhận'
        elif event == 'xac_nhan':
            txt = f'✅ {who} đã XÁC NHẬN tua {role} buổi "{khach}"'
        elif event == 'tu_choi':
            txt = f'❌ {who} TỪ CHỐI tua {role} buổi "{khach}" · lý do: {reason or "—"}'
        elif event == 'thu_hoi':
            txt = f'↩️ Thu hồi tua {role} buổi "{khach}" của {who} (chia lại)'
        elif event == 'sua':
            txt = f'✏️ Điều chỉnh số tua {role} buổi "{khach}" của {who} · cần xác nhận lại'
        else:
            txt = f'Tua {role} buổi "{khach}": {event}'
        post_oversight_log(txt)
    except Exception:
        pass
