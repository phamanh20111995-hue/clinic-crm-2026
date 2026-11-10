from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('services', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='service',
            name='tua_rate',
            field=models.DecimalField(decimal_places=0, default=0, help_text='Tien tua tra BS/KTV moi buoi thuc hien dich vu nay (P3)', max_digits=10),
        ),
    ]
