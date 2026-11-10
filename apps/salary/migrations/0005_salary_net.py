from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('salary', '0004_salary_3p'),
    ]

    operations = [
        migrations.AddField(
            model_name='salaryconfig',
            name='bh_salary',
            field=models.DecimalField(decimal_places=0, default=0, help_text='Lương đóng BH (0 = dùng P1 base_salary)', max_digits=12),
        ),
        migrations.AddField(
            model_name='salaryconfig',
            name='dependents',
            field=models.IntegerField(default=0, help_text='Số người phụ thuộc (giảm trừ TNCN)'),
        ),
        migrations.AddField(
            model_name='monthlysalary',
            name='bh_deduct',
            field=models.DecimalField(decimal_places=0, default=0, help_text='Bảo hiểm bắt buộc NV đóng (10.5%)', max_digits=12),
        ),
        migrations.AddField(
            model_name='monthlysalary',
            name='tncn_deduct',
            field=models.DecimalField(decimal_places=0, default=0, help_text='Thuế TNCN lũy tiến', max_digits=12),
        ),
    ]
