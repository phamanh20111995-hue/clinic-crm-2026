from django.db import models
from django.conf import settings


class WorkShift(models.Model):
    SHIFT_CHOICES = [
        ('sang', 'Sáng 08-12'),
        ('chieu', 'Chiều 12-17'),
        ('toi', 'Tối 17-20'),
        ('full', 'Full 08-17'),
    ]
    name = models.CharField(max_length=10, choices=SHIFT_CHOICES, unique=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    allowed_late_minutes = models.IntegerField(default=5)

    class Meta:
        verbose_name = 'Ca làm việc'
        ordering = ['start_time']

    def __str__(self):
        return self.get_name_display()


class ShiftAssignment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='shift_assignments')
    shift = models.ForeignKey(WorkShift, on_delete=models.CASCADE, related_name='assignments')
    date = models.DateField()

    class Meta:
        unique_together = ['user', 'date', 'shift']
        ordering = ['date', 'shift__start_time']

    def __str__(self):
        return f"{self.user} — {self.shift} — {self.date}"


class AttendanceRecord(models.Model):
    STATUS_CHOICES = [
        ('on_time', 'Đúng giờ'),
        ('late', 'Đi muộn'),
        ('early', 'Về sớm'),
        ('absent', 'Vắng mặt'),
        ('leave', 'Nghỉ phép'),
    ]
    SOURCE_CHOICES = [('machine', 'Máy chấm công'), ('manual', 'Thủ công')]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField()
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    late_minutes = models.IntegerField(default=0)
    early_minutes = models.IntegerField(default=0)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    source = models.CharField(max_length=10, choices=SOURCE_CHOICES, default='machine')
    manual_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'date']
        ordering = ['-date']

    def __str__(self):
        return f"{self.user} — {self.date} — {self.get_status_display()}"


class LeaveRequest(models.Model):
    LEAVE_TYPE_CHOICES = [
        ('annual', 'Phép năm'),
        ('unpaid', 'Không lương'),
        ('sick', 'Phép bệnh'),
    ]
    DURATION_CHOICES = [
        ('full_day',        'Cả ngày'),
        ('half_morning',    'Nửa ngày sáng'),
        ('half_afternoon',  'Nửa ngày chiều'),
        ('hourly',          'Theo giờ'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Chờ duyệt'),
        ('approved', 'Đã duyệt'),
        ('rejected', 'Từ chối'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='leave_requests')
    start_date = models.DateField()
    end_date = models.DateField()
    leave_type = models.CharField(max_length=10, choices=LEAVE_TYPE_CHOICES)
    reason = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    duration_type = models.CharField(max_length=20, choices=DURATION_CHOICES, default='full_day')
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='approved_leaves',
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    reject_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user} — {self.leave_type} — {self.start_date}~{self.end_date}"
