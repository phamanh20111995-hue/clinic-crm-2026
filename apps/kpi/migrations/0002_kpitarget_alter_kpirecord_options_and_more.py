from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('kpi', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='KPITarget',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('month', models.IntegerField()),
                ('year', models.IntegerField()),
                ('calls_target', models.IntegerField(default=0)),
                ('appointments_target', models.IntegerField(default=0)),
                ('revenue_target', models.DecimalField(decimal_places=0, default=0, max_digits=15)),
                ('contracts_target', models.IntegerField(default=0)),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='kpi_targets',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'ordering': ['-year', '-month']},
        ),
        migrations.AlterUniqueTogether(
            name='kpitarget',
            unique_together={('user', 'month', 'year')},
        ),
        migrations.AddField(
            model_name='kpirecord',
            name='tua_count',
            field=models.IntegerField(default=0),
        ),
        migrations.AlterModelOptions(
            name='kpirecord',
            options={'ordering': ['-year', '-month']},
        ),
    ]
