import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('customers', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='customer',
            name='cskh',
            field=models.ForeignKey(
                blank=True,
                limit_choices_to={'role': 'CSKH'},
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='cskh_customers',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name='customer',
            name='status',
            field=models.CharField(
                choices=[
                    ('chua_goi', 'Chưa gọi'),
                    ('da_goi', 'Đã gọi'),
                    ('khong_nghe', 'Không nghe máy'),
                    ('thue_bao', 'Thuê bao'),
                    ('sai_so', 'Sai số'),
                    ('tu_choi', 'Từ chối'),
                    ('hoan_so', 'Hoàn số'),
                    ('dat_lich', 'Đặt lịch'),
                    ('hen_goi', 'Hẹn gọi lại'),
                    ('can_tv', 'Cần tư vấn thêm'),
                    ('khong_qt', 'Không quan tâm'),
                    ('cho_phan_cskh', 'Chờ phân CSKH'),
                    ('dang_cham_soc', 'Đang chăm sóc'),
                ],
                default='chua_goi',
                max_length=20,
            ),
        ),
    ]
