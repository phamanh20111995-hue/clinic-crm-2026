from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('appointments', '0005_appointment_treatment_course_ids'),
        ('contracts', '0018_treatmentsession_tua_confirm'),
    ]

    operations = [
        migrations.CreateModel(
            name='TuaAllocation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('role', models.CharField(choices=[('BS_TU_VAN', 'BS tư vấn'), ('BS_DIEU_TRI', 'BS điều trị'), ('KTV', 'KTV'), ('SALE', 'Sale')], max_length=15)),
                ('service_name', models.CharField(blank=True, help_text='Snapshot ten DV luc chia', max_length=200)),
                ('amount', models.DecimalField(decimal_places=0, default=0, help_text='Tien tua nguoi nay duoc chia', max_digits=10)),
                ('status', models.CharField(choices=[('cho_xac_nhan', 'Chờ xác nhận'), ('da_xac_nhan', 'Đã xác nhận'), ('tu_choi', 'Từ chối'), ('huy', 'Đã hủy')], default='cho_xac_nhan', max_length=15)),
                ('confirmed_at', models.DateTimeField(blank=True, null=True)),
                ('reject_reason', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('appointment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tua_allocations', to='appointments.appointment')),
                ('session', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='tua_allocations', to='contracts.treatmentsession')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tua_allocations', to=settings.AUTH_USER_MODEL)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='tua_allocations_created', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Chia tua',
                'ordering': ['-created_at'],
                'unique_together': {('appointment', 'user', 'role')},
            },
        ),
    ]
