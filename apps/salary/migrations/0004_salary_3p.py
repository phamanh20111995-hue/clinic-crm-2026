from django.db import migrations, models

COMMISSION_ROLE_CHOICES = [
    ('SALE', 'Sale'), ('LEAD_SALE', 'Lead Sale'),
    ('CSKH', 'CSKH'), ('LEAD_CSKH', 'Lead CSKH'),
    ('TELE', 'Tele'), ('LEAD_TELE', 'Lead Tele'),
    ('MKT', 'Marketing'), ('LEAD_MKT', 'Lead Marketing'),
    ('TRUC_PAGE', 'Truc page'), ('LEAD_TRUC_PAGE', 'Lead Truc page'),
    ('BS', 'Bac si'), ('KTV', 'KTV'),
]


class Migration(migrations.Migration):

    dependencies = [
        ('salary', '0003_alter_salaryconfig_options_and_more'),
    ]

    operations = [
        # ── SalaryConfig: P1/P2 ──
        migrations.AddField(
            model_name='salaryconfig',
            name='competency_salary',
            field=models.DecimalField(decimal_places=0, default=0, help_text='P2 - Luong nang luc/tham nien (chia theo cong)', max_digits=12),
        ),
        migrations.AddField(
            model_name='salaryconfig',
            name='allowance',
            field=models.DecimalField(decimal_places=0, default=0, help_text='P2 - Phu cap co dinh: an ca, xang xe, dien thoai (chia theo cong)', max_digits=12),
        ),
        migrations.AlterField(
            model_name='salaryconfig',
            name='base_salary',
            field=models.DecimalField(decimal_places=0, default=0, help_text='P1 - Luong vi tri (chia theo cong)', max_digits=12),
        ),
        migrations.AlterField(
            model_name='salaryconfig',
            name='commission_rate',
            field=models.DecimalField(decimal_places=2, default=0, help_text='[Legacy] da thay bang CommissionRate theo vai tro', max_digits=5),
        ),
        migrations.AlterField(
            model_name='salaryconfig',
            name='tua_rate',
            field=models.DecimalField(decimal_places=0, default=0, help_text='[Legacy] da thay bang Service.tua_rate theo dich vu', max_digits=8),
        ),
        # ── MonthlySalary: P1/P2/P3 breakdown ──
        migrations.AddField(
            model_name='monthlysalary',
            name='competency',
            field=models.DecimalField(decimal_places=0, default=0, help_text='P2 - luong nang luc (da chia cong)', max_digits=12),
        ),
        migrations.AddField(
            model_name='monthlysalary',
            name='allowance',
            field=models.DecimalField(decimal_places=0, default=0, help_text='P2 - phu cap (da chia cong)', max_digits=12),
        ),
        migrations.AlterField(
            model_name='monthlysalary',
            name='base',
            field=models.DecimalField(decimal_places=0, default=0, help_text='P1 - luong vi tri (da chia cong)', max_digits=12),
        ),
        migrations.AlterField(
            model_name='monthlysalary',
            name='commission',
            field=models.DecimalField(decimal_places=0, default=0, help_text='P3 - hoa hong thuc thu', max_digits=12),
        ),
        migrations.AlterField(
            model_name='monthlysalary',
            name='tua_income',
            field=models.DecimalField(decimal_places=0, default=0, help_text='P3 - tua BS/KTV', max_digits=12),
        ),
        # ── CommissionRate (P3 % theo vai tro) ──
        migrations.CreateModel(
            name='CommissionRate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('role', models.CharField(choices=COMMISSION_ROLE_CHOICES, max_length=20, unique=True)),
                ('percent', models.DecimalField(decimal_places=2, default=0, help_text='% hoa hong tren thuc thu (vong thuong)', max_digits=5)),
                ('percent_upsale', models.DecimalField(decimal_places=2, default=0, help_text='% hoa hong tren thuc thu HD upsale (ban them)', max_digits=5)),
                ('note', models.CharField(blank=True, max_length=200)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Ty le hoa hong theo vai tro',
                'ordering': ['role'],
            },
        ),
    ]
