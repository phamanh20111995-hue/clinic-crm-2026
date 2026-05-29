from django.db import models
from django.conf import settings
class Appointment(models.Model):
    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE, related_name='appointments')
    scheduled_at = models.DateTimeField()
    service = models.ForeignKey('services.Service', on_delete=models.SET_NULL, null=True, blank=True)
    booked_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='booked_appointments')
    STATUS_CHOICES = [('pending','Chờ đến'),('confirmed','Xác nhận đến'),('in_progress','Đang điều trị'),('done','Hoàn thành'),('cancelled','Hủy')]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    room = models.ForeignKey('clinics.Room', null=True, blank=True, on_delete=models.SET_NULL)
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='doctor_appointments')
    ktv = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='ktv_appointments')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_walkin = models.BooleanField(default=False)
    tua_confirmed = models.BooleanField(default=False)
    tua_confirmed_via_zalo = models.BooleanField(default=False)
    class Meta: verbose_name='Lịch hẹn'; ordering=['-scheduled_at']
