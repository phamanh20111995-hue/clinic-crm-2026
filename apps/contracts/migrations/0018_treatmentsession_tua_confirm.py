from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('contracts', '0017_deposit_cash_amount_deposit_transfer_amount_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='treatmentsession',
            name='tua_status',
            field=models.CharField(
                choices=[('cho_xac_nhan', 'Chờ xác nhận'), ('da_xac_nhan', 'Đã xác nhận'), ('tu_choi', 'Từ chối')],
                default='cho_xac_nhan', max_length=15,
                help_text='Chi buoi da_xac_nhan moi tinh tua vao luong'),
        ),
        migrations.AddField(
            model_name='treatmentsession',
            name='tua_confirmed_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                                    related_name='tua_confirmations', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='treatmentsession',
            name='tua_confirmed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='treatmentsession',
            name='tua_reject_reason',
            field=models.TextField(blank=True),
        ),
    ]
