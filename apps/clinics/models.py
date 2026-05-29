from django.db import models
from django.conf import settings


class Room(models.Model):
    """Phòng điều trị — dùng trong sơ đồ phòng Sprint 3."""
    clinic = models.ForeignKey('accounts.Clinic', on_delete=models.CASCADE, related_name='rooms')
    name = models.CharField(max_length=50)
    ROOM_TYPE_CHOICES = [('consultation', 'Tư vấn'), ('treatment', 'Điều trị'), ('dental', 'Nha khoa')]
    room_type = models.CharField(max_length=20, choices=ROOM_TYPE_CHOICES)
    capacity = models.IntegerField(default=1)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Phòng'

    def __str__(self):
        return f'{self.clinic.name} — {self.name}'
