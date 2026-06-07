"""
Migration 0002: Add visit_type, sale fields; add 'consulting' to STATUS_CHOICES.

Safe with existing data:
- visit_type: default='tu_van'
- sale: nullable FK
- status: CharField — adding a new choice string doesn't touch existing rows
"""
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('appointments', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # 1. Add visit_type field
        migrations.AddField(
            model_name='appointment',
            name='visit_type',
            field=models.CharField(
                choices=[
                    ('tu_van',    'Tư vấn'),
                    ('dieu_tri',  'Điều trị'),
                    ('tai_kham',  'Tái khám'),
                    ('khieu_nai', 'Khiếu nại'),
                ],
                default='tu_van',
                max_length=20,
            ),
        ),
        # 2. Add sale FK
        migrations.AddField(
            model_name='appointment',
            name='sale',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='sale_appointments',
                limit_choices_to={'role': 'SALE'},
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        # 3. Alter status field to include 'consulting' choice
        #    (existing rows with old choices remain valid — Django choices are UI hints only)
        migrations.AlterField(
            model_name='appointment',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending',     'Chờ đến'),
                    ('confirmed',   'Xác nhận đến'),
                    ('consulting',  'Đang tư vấn'),
                    ('in_progress', 'Đang điều trị'),
                    ('done',        'Hoàn thành'),
                    ('cancelled',   'Hủy'),
                ],
                default='pending',
                max_length=20,
            ),
        ),
    ]
