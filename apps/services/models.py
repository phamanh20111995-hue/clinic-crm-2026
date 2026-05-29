from django.db import models


class ServiceCategory(models.Model):
    name = models.CharField(max_length=100)
    clinic_type = models.CharField(max_length=20, choices=[('daLieu', 'Da liễu'), ('nhaKhoa', 'Nha khoa')])

    class Meta:
        verbose_name = 'Danh mục dịch vụ'

    def __str__(self):
        return self.name


class Service(models.Model):
    category = models.ForeignKey(ServiceCategory, on_delete=models.CASCADE, related_name='services')
    name = models.CharField(max_length=200)
    unit_price = models.DecimalField(max_digits=15, decimal_places=0)
    sessions = models.IntegerField(default=1)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Dịch vụ'

    def __str__(self):
        return self.name
