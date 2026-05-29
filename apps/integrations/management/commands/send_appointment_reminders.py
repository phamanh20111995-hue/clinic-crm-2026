"""
Gửi nhắc lịch hẹn qua Zalo cho ngày mai.

Chạy hàng ngày lúc 20:00 qua cron hoặc Celery Beat:
    python manage.py send_appointment_reminders

Cron example:
    0 20 * * * /path/to/venv/bin/python /app/manage.py send_appointment_reminders
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
import datetime


class Command(BaseCommand):
    help = 'Gửi nhắc lịch hẹn qua Zalo cho ngày mai'

    def add_arguments(self, parser):
        parser.add_argument(
            '--date', type=str, default=None,
            help='Ngày cần gửi nhắc (YYYY-MM-DD). Mặc định: ngày mai.',
        )
        parser.add_argument('--dry-run', action='store_true', help='Không gửi thật, chỉ in ra.')

    def handle(self, *args, **options):
        from apps.appointments.models import Appointment
        from apps.integrations.zalo_client import send_appointment_reminder

        date_str = options.get('date')
        if date_str:
            target_date = datetime.date.fromisoformat(date_str)
        else:
            target_date = timezone.now().date() + datetime.timedelta(days=1)

        appointments = Appointment.objects.filter(
            scheduled_at__date=target_date,
            status__in=['pending', 'confirmed'],
        ).select_related('customer')

        self.stdout.write(f"Tìm thấy {appointments.count()} lịch hẹn vào {target_date}.")

        sent = skipped = failed = 0
        for appt in appointments:
            # Kiểm tra KH có liên kết Zalo không
            try:
                _ = appt.customer.zalo_binding
            except Exception:
                skipped += 1
                continue

            if options['dry_run']:
                self.stdout.write(f"  [DRY-RUN] Sẽ gửi nhắc cho {appt.customer.full_name} (lịch #{appt.id})")
                sent += 1
                continue

            ok = send_appointment_reminder(appt)
            if ok:
                sent += 1
                self.stdout.write(f"  ✓ Đã gửi: {appt.customer.full_name}")
            else:
                failed += 1
                self.stdout.write(f"  ✗ Thất bại: {appt.customer.full_name}")

        self.stdout.write(
            self.style.SUCCESS(
                f"Hoàn tất: {sent} gửi thành công, {skipped} bỏ qua (không có Zalo), {failed} thất bại."
            )
        )
