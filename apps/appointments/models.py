from django.db import models
from django.conf import settings


class Appointment(models.Model):
    VISIT_TYPE_CHOICES = [
        ('tu_van',    'Tư vấn'),
        ('dieu_tri',  'Điều trị'),
        ('tai_kham',  'Tái khám'),
        ('khieu_nai', 'Khiếu nại'),
    ]
    STATUS_CHOICES = [
        ('pending',         'Chờ đến'),
        ('confirmed',       'Xác nhận đến'),
        ('waiting_consult', 'Chờ tư vấn'),
        ('waiting_treat',   'Chờ điều trị'),
        ('consulting',      'Đang tư vấn'),
        ('in_progress',     'Đang điều trị'),
        ('done',            'Hoàn thành'),
        ('cancelled',       'Hủy'),
    ]

    customer     = models.ForeignKey('customers.Customer', on_delete=models.CASCADE, related_name='appointments')
    scheduled_at = models.DateTimeField()
    service      = models.ForeignKey('services.Service', on_delete=models.SET_NULL, null=True, blank=True)
    booked_by    = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
                                     related_name='booked_appointments')

    status       = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    visit_type   = models.CharField(max_length=20, choices=VISIT_TYPE_CHOICES, default='tu_van')

    room         = models.ForeignKey('clinics.Room', null=True, blank=True, on_delete=models.SET_NULL)
    doctor       = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True,
                                     on_delete=models.SET_NULL, related_name='doctor_appointments')
    ktv          = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True,
                                     on_delete=models.SET_NULL, related_name='ktv_appointments')
    sale         = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True,
                                     on_delete=models.SET_NULL, related_name='sale_appointments',
                                     limit_choices_to={'role': 'SALE'})

    notes        = models.TextField(blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    checked_out_at = models.DateTimeField(null=True, blank=True)
    is_walkin    = models.BooleanField(default=False)
    tua_confirmed          = models.BooleanField(default=False)
    tua_confirmed_via_zalo = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Lịch hẹn'
        ordering = ['-scheduled_at']
