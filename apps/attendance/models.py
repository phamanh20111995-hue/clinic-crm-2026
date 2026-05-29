from django.db import models
from django.conf import settings


class WorkShift(models.Model):
    SHIFT_CHOICES = [
        ('sang', 'Sáng 08-12'), ('chieu', 'Chiều 12-17'),
        ('toi', 'Tối 17-20'), ('full', 'Full 08-17'),
    ]
    name = models.CharField(max_length=10, choices=SHIFT_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    allowed_late_minutes = models.IntegerField(default=5)

    class Meta:
        verbose_name = 'Ca làm việc'

    def __str__(self):
        return self.get_name_display()


class ShiftAssignment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='shift_assignments')
    shift = models.ForeignKey(WorkShift, on_delete=models.CASCADE)
    date = models.DateField()

    class Meta:
        unique_together = ['user', 'date', 'shift']
        verbose_name = 'Phân ca'


class AttendanceRecord(models.Model):
    """Dữ liệu từ máy chấm công ZKTeco."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField()
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    late_minutes = models.IntegerField(default=0)
    early_minutes = models.IntegerField(default=0)
    STATUS_CHOICES = [
        ('on_time', 'Đúng giờ'), ('late', 'Đi muộn'),
        ('early', 'Về sớm'), ('absent', 'Vắng mặt'), ('leave', 'Nghỉ phép'),
    ]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    source = models.CharField(
        max_length=10, choices=[('machine', 'Máy CC'), ('manual', 'Thủ công')],
        default='machine',
    )
    manual_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'date']
        verbose_name = 'Chấm công'
        ordering = ['-date']


class LeaveRequest(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='leave_requests')
    start_date = models.DateField()
    end_date = models.DateField()
    LEAVE_TYPE_CHOICES = [
        ('annual', 'Phép năm'), ('unpaid', 'Không lương'), ('sick', 'Phép bệnh'),
    ]
    leave_type = models.CharField(max_length=10, choices=LEAVE_TYPE_CHOICES)
    reason = models.TextField()
    STATUS_CHOICES = [('pending', 'Chờ duyệt'), ('approved', 'Đã duyệt'), ('rejected', 'Từ chối')]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='approved_leaves',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Đơn nghỉ phép'
        ordering = ['-created_at']
