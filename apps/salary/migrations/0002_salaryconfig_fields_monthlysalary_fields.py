from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('salary', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # SalaryConfig new fields
        migrations.AddField(
            model_name='salaryconfig',
            name='late_deduct_per_minute',
            field=models.DecimalField(decimal_places=0, default=0, max_digits=8),
        ),
        migrations.AddField(
            model_name='salaryconfig',
            name='absent_deduct_per_day',
            field=models.DecimalField(decimal_places=0, default=0, max_digits=10),
        ),
        # MonthlySalary new fields
        migrations.AddField(
            model_name='monthlysalary',
            name='actual_days',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='monthlysalary',
            name='late_minutes_total',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='monthlysalary',
            name='absent_days',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='monthlysalary',
            name='bonus',
            field=models.DecimalField(decimal_places=0, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name='monthlysalary',
            name='notes',
            field=models.TextField(blank=True, default=''),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='monthlysalary',
            name='approved_by',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='approved_salaries',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name='monthlysalary',
            name='approved_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='monthlysalary',
            name='created_at',
            field=models.DateTimeField(default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AlterModelOptions(
            name='monthlysalary',
            options={'ordering': ['-year', '-month']},
        ),
    ]
