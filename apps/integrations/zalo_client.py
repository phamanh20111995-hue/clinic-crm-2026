"""
Zalo OA API v3 client.
Docs: https://developers.zalo.me/docs/official-account/

Usage:
    client = ZaloOAClient.from_db()
    client.send_text(zalo_user_id, "Tin nhắn")
    client.send_template(zalo_user_id, template_id, template_data)
"""
import json
import logging
import urllib.request
import urllib.parse
import urllib.error
from django.utils import timezone

logger = logging.getLogger(__name__)

ZALO_API_BASE = 'https://openapi.zalo.me/v3.0/oa'
ZALO_TOKEN_URL = 'https://oauth.zaloapp.com/v4/oa/access_token'


class ZaloAPIError(Exception):
    def __init__(self, error, message):
        self.error = error
        self.message = message
        super().__init__(f"[{error}] {message}")


class ZaloOAClient:
    def __init__(self, access_token, app_id=None, app_secret=None, refresh_token=None, config_pk=None):
        self.access_token = access_token
        self.app_id = app_id
        self.app_secret = app_secret
        self.refresh_token = refresh_token
        self.config_pk = config_pk

    @classmethod
    def from_db(cls):
        from .models import ZaloConfig
        cfg = ZaloConfig.objects.first()
        if not cfg:
            raise ZaloAPIError(0, 'Zalo OA chưa được cấu hình. Vào Admin → ZaloConfig để thêm.')
        from decouple import config as env
        return cls(
            access_token=cfg.access_token,
            app_id=env('ZALO_APP_ID', default=''),
            app_secret=env('ZALO_APP_SECRET', default=''),
            refresh_token=cfg.refresh_token,
            config_pk=cfg.pk,
        )

    def _request(self, method, path, data=None, params=None):
        url = f"{ZALO_API_BASE}{path}"
        if params:
            url += '?' + urllib.parse.urlencode(params)
        headers = {
            'access_token': self.access_token,
            'Content-Type': 'application/json',
        }
        body = json.dumps(data).encode() if data else None
        req = urllib.request.Request(url, data=body, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                result = json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            result = json.loads(e.read().decode())
        if result.get('error') not in (0, None) or result.get('errorCode') not in (0, None):
            code = result.get('error') or result.get('errorCode', -1)
            msg = result.get('message') or result.get('errorMsg', 'Unknown error')
            raise ZaloAPIError(code, msg)
        return result

    def refresh_access_token(self):
        """Làm mới access token và lưu vào DB."""
        from decouple import config as env
        data = urllib.parse.urlencode({
            'refresh_token': self.refresh_token,
            'app_id': self.app_id,
            'grant_type': 'refresh_token',
            'secret_key': self.app_secret,
        }).encode()
        req = urllib.request.Request(ZALO_TOKEN_URL, data=data, method='POST')
        req.add_header('Content-Type', 'application/x-www-form-urlencoded')
        with urllib.request.urlopen(req, timeout=10) as resp:
            result = json.loads(resp.read().decode())

        if 'access_token' not in result:
            raise ZaloAPIError(-1, f"Token refresh failed: {result}")

        self.access_token = result['access_token']
        if result.get('refresh_token'):
            self.refresh_token = result['refresh_token']

        if self.config_pk:
            from .models import ZaloConfig
            from datetime import timedelta
            ZaloConfig.objects.filter(pk=self.config_pk).update(
                access_token=self.access_token,
                refresh_token=self.refresh_token,
                token_expires_at=timezone.now() + timedelta(seconds=result.get('expires_in', 3600)),
            )
        return result

    def send_text(self, zalo_user_id, text):
        """Gửi tin nhắn văn bản đơn giản."""
        return self._request('POST', '/message/cs', data={
            'recipient': {'user_id': zalo_user_id},
            'message': {'text': text},
        })

    def send_template(self, zalo_user_id, template_id, template_data):
        """Gửi ZNS template message."""
        return self._request('POST', '/message/template', data={
            'phone': zalo_user_id,
            'template_id': template_id,
            'template_data': template_data,
        })

    def get_profile(self, zalo_user_id):
        """Lấy thông tin follower."""
        return self._request('GET', '/getprofile', params={'user_id': zalo_user_id})


def _log(zalo_user_id, direction, msg_type, content, status='sent', error='', message_id='', appt_id=None):
    from .models import ZaloMessageLog
    ZaloMessageLog.objects.create(
        zalo_user_id=zalo_user_id,
        direction=direction,
        msg_type=msg_type,
        content=content,
        status=status,
        error=error,
        message_id=message_id,
        related_appointment_id=appt_id,
    )


def send_appointment_reminder(appointment):
    """
    Gửi nhắc lịch hẹn qua Zalo 1 ngày trước.
    Gọi từ management command hoặc Celery task.
    """
    customer = appointment.customer
    try:
        binding = customer.zalo_binding
    except Exception:
        return False

    text = (
        f"Xin chào {customer.full_name}!\n"
        f"Phòng khám nhắc bạn có lịch hẹn vào lúc "
        f"{appointment.scheduled_at:%H:%M ngày %d/%m/%Y}.\n"
        f"Vui lòng đến đúng giờ. Cảm ơn bạn!"
    )
    try:
        client = ZaloOAClient.from_db()
        result = client.send_text(binding.zalo_user_id, text)
        _log(binding.zalo_user_id, 'out', 'appointment_reminder', text,
             message_id=result.get('data', {}).get('message_id', ''),
             appt_id=appointment.id)
        return True
    except ZaloAPIError as e:
        _log(binding.zalo_user_id, 'out', 'appointment_reminder', text,
             status='error', error=str(e), appt_id=appointment.id)
        logger.warning("Zalo send_appointment_reminder failed: %s", e)
        return False


def send_tua_confirm_link(appointment, confirm_token):
    """
    Gửi link xác nhận tua qua Zalo sau điều trị.
    confirm_token là JWT / signed token để bấm xác nhận không cần đăng nhập.
    """
    from decouple import config as env
    customer = appointment.customer
    try:
        binding = customer.zalo_binding
    except Exception:
        return False

    frontend_url = env('FRONTEND_URL', default='http://localhost:3000')
    confirm_url = f"{frontend_url}/confirm-tua/{confirm_token}"

    text = (
        f"Xin chào {customer.full_name}!\n"
        f"Cảm ơn bạn đã sử dụng dịch vụ tại phòng khám.\n"
        f"Vui lòng xác nhận đã hoàn thành tua bằng cách bấm vào link:\n"
        f"{confirm_url}\n"
        f"(Link có hiệu lực trong 24 giờ)"
    )
    try:
        client = ZaloOAClient.from_db()
        result = client.send_text(binding.zalo_user_id, text)
        _log(binding.zalo_user_id, 'out', 'tua_confirm', text,
             message_id=result.get('data', {}).get('message_id', ''),
             appt_id=appointment.id)
        return True
    except ZaloAPIError as e:
        _log(binding.zalo_user_id, 'out', 'tua_confirm', text,
             status='error', error=str(e), appt_id=appointment.id)
        logger.warning("Zalo send_tua_confirm_link failed: %s", e)
        return False
