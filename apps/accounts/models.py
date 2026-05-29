from django.contrib.auth.models import AbstractUser
from django.db import models


# RBAC theo CLAUDE.md — 10 roles chính xác
ROLE_CHOICES = [
    ('QUAN_LY',   'Quản lý'),
    ('CHU_DN',    'Chủ doanh nghiệp'),
    ('LEAD_SALE', 'Lead Sale'),
    ('LEAD_TELE', 'Lead Tele'),
    ('LEAD_CSKH', 'Lead CSKH'),
    ('SALE',      'Sale'),
    ('TELE',      'Tele'),
    ('CSKH',      'CSKH'),
    ('LE_TAN',    'Lễ tân'),
    ('KE_TOAN',   'Kế toán'),
]

# Roles được xem full hồ sơ KH (CLAUDE.md)
FULL_ACCESS_ROLES = frozenset([
    'QUAN_LY', 'CHU_DN', 'LEAD_SALE', 'LEAD_TELE',
    'KE_TOAN', 'LE_TAN', 'LEAD_CSKH', 'CSKH',
])

MANAGEMENT_ROLES = frozenset(['QUAN_LY', 'CHU_DN'])
LEAD_ROLES = frozenset(['LEAD_SALE', 'LEAD_TELE', 'LEAD_CSKH', 'QUAN_LY', 'CHU_DN'])


class User(AbstractUser):
    """
    Custom User model theo CLAUDE.md.
    Dùng email làm username đăng nhập.
    """
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    phone = models.CharField(max_length=15, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'role']

    class Meta:
        verbose_name = 'Người dùng'
        verbose_name_plural = 'Người dùng'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_full_name() or self.email} [{self.get_role_display()}]'

    @property
    def display_name(self):
        return self.get_full_name() or self.email

    @property
    def has_full_customer_access(self):
        return self.role in FULL_ACCESS_ROLES

    @property
    def is_management(self):
        return self.role in MANAGEMENT_ROLES

    @property
    def is_lead(self):
        return self.role in LEAD_ROLES


class Clinic(models.Model):
    """Phòng khám (Da Liễu / Nha Khoa) theo CLAUDE.md."""
    name = models.CharField(max_length=200)
    address = models.TextField()
    phone = models.CharField(max_length=15)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Phòng khám'
        verbose_name_plural = 'Phòng khám'

    def __str__(self):
        return self.name
