import hashlib
import hmac
import json
import logging

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone

from .models import ZaloConfig, ZaloUserBinding, ZaloMessageLog
from .zalo_client import ZaloOAClient, ZaloAPIError, send_appointment_reminder, send_tua_confirm_link

logger = logging.getLogger(__name__)


def _verify_webhook_signature(request):
    """Kiểm tra chữ ký HMAC-SHA256 từ Zalo webhook."""
    cfg = ZaloConfig.objects.first()
    if not cfg or not cfg.webhook_secret:
        return True  # Chưa cấu hình secret → bỏ qua kiểm tra (dev mode)
    sig = request.headers.get('X-Zalo-Signature', '')
    body = request.body
    expected = hmac.new(cfg.webhook_secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(sig, expected)


@csrf_exempt
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def zalo_webhook(request):
    """
    GET  /api/integrations/zalo/webhook/ — Zalo gọi để xác minh webhook (challenge)
    POST /api/integrations/zalo/webhook/ — Zalo gửi sự kiện (tin nhắn, follow, ...)
    """
    # Xác minh webhook (GET challenge)
    if request.method == 'GET':
        challenge = request.query_params.get('challenge', '')
        return Response({'challenge': challenge})

    # Kiểm tra chữ ký
    if not _verify_webhook_signature(request):
        logger.warning("Zalo webhook: invalid signature")
        return Response({'error': 'invalid signature'}, status=403)

    try:
        payload = request.data
    except Exception:
        return Response({'error': 'bad json'}, status=400)

    event_name = payload.get('event_name', '')
    follower = payload.get('follower', {})
    message = payload.get('message', {})
    zalo_user_id = follower.get('id', '') or payload.get('sender', {}).get('id', '')

    # Log mọi sự kiện vào DB
    ZaloMessageLog.objects.create(
        zalo_user_id=zalo_user_id,
        direction='in',
        msg_type='webhook_in',
        content=json.dumps(payload, ensure_ascii=False)[:2000],
        status='received',
    )

    if event_name == 'follow':
        _handle_follow(zalo_user_id, follower)
    elif event_name == 'unfollow':
        _handle_unfollow(zalo_user_id)
    elif event_name in ('user_send_text', 'user_send_image', 'user_send_file'):
        _handle_incoming_message(zalo_user_id, message, payload)

    return Response({'status': 'ok'})


def _handle_follow(zalo_user_id, follower_data):
    """KH follow OA → tạo ZaloUserBinding nếu chưa có."""
    if not zalo_user_id:
        return
    ZaloUserBinding.objects.get_or_create(
        zalo_user_id=zalo_user_id,
        defaults={
            'display_name': follower_data.get('display_name', ''),
            'avatar_url': follower_data.get('avatar', ''),
        },
    )


def _handle_unfollow(zalo_user_id):
    pass  # Giữ binding để lưu lịch sử, không xóa


def _handle_incoming_message(zalo_user_id, message, payload):
    """
    Xử lý tin nhắn từ KH gửi vào OA.
    Hiện tại: log vào DB. Sprint sau có thể thêm auto-reply.
    """
    pass


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_reminder(request, appointment_id):
    """
    POST /api/integrations/zalo/send-reminder/{appointment_id}/
    Gửi nhắc lịch hẹn thủ công cho 1 lịch hẹn.
    """
    from apps.appointments.models import Appointment
    appt = Appointment.objects.filter(pk=appointment_id).select_related('customer').first()
    if not appt:
        return Response({'detail': 'Không tìm thấy lịch hẹn.'}, status=404)
    ok = send_appointment_reminder(appt)
    return Response({'sent': ok})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_tua_link(request, appointment_id):
    """
    POST /api/integrations/zalo/send-tua-link/{appointment_id}/
    Gửi link xác nhận tua qua Zalo.
    """
    from apps.appointments.models import Appointment
    from rest_framework_simplejwt.tokens import AccessToken
    appt = Appointment.objects.filter(pk=appointment_id).select_related('customer').first()
    if not appt:
        return Response({'detail': 'Không tìm thấy lịch hẹn.'}, status=404)

    # Tạo token ngắn hạn để KH xác nhận không cần đăng nhập
    # Dùng data encode vào JWT payload
    import base64, json as _json
    payload = _json.dumps({'appt_id': appt.id, 'action': 'tua_confirm'})
    token = base64.urlsafe_b64encode(payload.encode()).decode()
    ok = send_tua_confirm_link(appt, token)
    return Response({'sent': ok, 'confirm_token': token})


@api_view(['POST'])
@permission_classes([AllowAny])
def confirm_tua_via_zalo(request):
    """
    POST /api/integrations/zalo/confirm-tua/
    Body: {"token": "<base64 token>"}
    KH bấm link trong Zalo → xác nhận tua không cần đăng nhập.
    """
    import base64, json as _json
    token = request.data.get('token', '')
    try:
        payload = _json.loads(base64.urlsafe_b64decode(token.encode()).decode())
        appt_id = payload['appt_id']
        assert payload.get('action') == 'tua_confirm'
    except Exception:
        return Response({'detail': 'Token không hợp lệ.'}, status=400)

    from apps.appointments.models import Appointment
    appt = Appointment.objects.filter(pk=appt_id).first()
    if not appt:
        return Response({'detail': 'Lịch hẹn không tồn tại.'}, status=404)
    if appt.tua_confirmed:
        return Response({'detail': 'Tua đã được xác nhận trước đó.'})

    appt.tua_confirmed = True
    appt.tua_confirmed_via_zalo = True
    appt.status = 'done'
    appt.save(update_fields=['tua_confirmed', 'tua_confirmed_via_zalo', 'status'])

    return Response({'detail': 'Xác nhận tua thành công. Cảm ơn bạn!'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def zalo_message_logs(request):
    """GET /api/integrations/zalo/logs/ — lịch sử tin nhắn Zalo."""
    if request.user.role not in ('QUAN_LY', 'CHU_DN', 'KE_TOAN', 'LEAD_CSKH', 'CSKH'):
        return Response({'detail': 'Không có quyền.'}, status=403)
    qs = ZaloMessageLog.objects.all()[:100]
    from .serializers import ZaloMessageLogSerializer
    return Response(ZaloMessageLogSerializer(qs, many=True).data)
