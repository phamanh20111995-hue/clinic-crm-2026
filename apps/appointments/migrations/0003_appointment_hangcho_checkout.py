"""
Migration 0003: Add waiting_consult / waiting_treat status choices + checked_out_at field.

Safe with existing data:
- checked_out_at: nullable DateTimeField — existing rows get NULL
- status: CharField choices update is metadata-only in Django (no DB column change needed)
"""
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('appointments', '0002_appointment_visit_type_sale_status_consulting'),
    ]

    operations = [
        # 1. Add checked_out_at (nullable — safe for existing rows)
        migrations.AddField(
            model_name='appointment',
            name='checked_out_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        # 2. Expand status choices to include waiting_consult / waiting_treat
        #    (Django choices are advisory; the underlying VARCHAR column is unchanged)
        migrations.AlterField(
            model_name='appointment',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending',         'Chờ đến'),
                    ('confirmed',       'Xác nhận đến'),
                    ('waiting_consult', 'Chờ tư vấn'),
                    ('waiting_treat',   'Chờ điều trị'),
                    ('consulting',      'Đang tư vấn'),
                    ('in_progress',     'Đang điều trị'),
                    ('done',            'Hoàn thành'),
                    ('cancelled',       'Hủy'),
                ],
                default='pending',
                max_length=20,
            ),
        ),
    ]
