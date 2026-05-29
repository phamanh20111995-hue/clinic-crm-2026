"""
python manage.py seed_data
Tạo dữ liệu mẫu: 2 phòng khám, 1 user cho mỗi role, dịch vụ mẫu.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.accounts.models import Clinic, ROLE_CHOICES
from apps.services.models import ServiceCategory, Service
from apps.clinics.models import Room

User = get_user_model()

DEMO_USERS = [
    {'role': 'QUAN_LY',   'email': 'quanly@clinic.vn',     'first_name': 'Nguyễn', 'last_name': 'Quản Lý'},
    {'role': 'CHU_DN',    'email': 'chudn@clinic.vn',       'first_name': 'Trần',   'last_name': 'Chủ DN'},
    {'role': 'LEAD_SALE', 'email': 'leadsale@clinic.vn',    'first_name': 'Lê',     'last_name': 'Lead Sale'},
    {'role': 'LEAD_TELE', 'email': 'leadtele@clinic.vn',    'first_name': 'Phạm',   'last_name': 'Lead Tele'},
    {'role': 'LEAD_CSKH', 'email': 'leadcskh@clinic.vn',   'first_name': 'Hoàng',  'last_name': 'Lead CSKH'},
    {'role': 'SALE',      'email': 'sale1@clinic.vn',        'first_name': 'Vũ',     'last_name': 'Sale 1'},
    {'role': 'TELE',      'email': 'tele1@clinic.vn',        'first_name': 'Đỗ',     'last_name': 'Tele 1'},
    {'role': 'CSKH',      'email': 'cskh1@clinic.vn',        'first_name': 'Bùi',    'last_name': 'CSKH 1'},
    {'role': 'LE_TAN',    'email': 'letan@clinic.vn',        'first_name': 'Ngô',    'last_name': 'Lễ Tân'},
    {'role': 'KE_TOAN',   'email': 'ketoan@clinic.vn',       'first_name': 'Đinh',   'last_name': 'Kế Toán'},
]


class Command(BaseCommand):
    help = 'Tạo dữ liệu mẫu cho demo'

    def handle(self, *args, **options):
        self._seed_clinics()
        self._seed_users()
        self._seed_services()
        self.stdout.write(self.style.SUCCESS('✓ Seed data hoàn thành!'))
        self.stdout.write('  Mật khẩu mặc định: Demo@123456')

    def _seed_clinics(self):
        clinic1, _ = Clinic.objects.get_or_create(
            name='Phòng Khám Da Liễu Hà Nội',
            defaults={'address': '123 Đường ABC, Hoàn Kiếm, HN', 'phone': '024.1234.5678'},
        )
        clinic2, _ = Clinic.objects.get_or_create(
            name='Phòng Khám Nha Khoa Hà Nội',
            defaults={'address': '456 Đường XYZ, Đống Đa, HN', 'phone': '024.8765.4321'},
        )
        for clinic in [clinic1, clinic2]:
            for i in range(1, 4):
                Room.objects.get_or_create(
                    clinic=clinic, name=f'Phòng {i}',
                    defaults={'room_type': 'treatment'},
                )
        self.stdout.write('  ✓ Clinics + Rooms')

    def _seed_users(self):
        for data in DEMO_USERS:
            username = data['email'].split('@')[0]
            if not User.objects.filter(email=data['email']).exists():
                User.objects.create_user(
                    email=data['email'],
                    username=username,
                    password='Demo@123456',
                    first_name=data['first_name'],
                    last_name=data['last_name'],
                    role=data['role'],
                )
        # Superuser
        if not User.objects.filter(email='admin@clinic.vn').exists():
            User.objects.create_superuser(
                email='admin@clinic.vn',
                username='admin',
                password='Admin@123456',
                first_name='Admin',
                last_name='System',
                role='QUAN_LY',
            )
        self.stdout.write('  ✓ Users (10 roles + admin)')

    def _seed_services(self):
        cat1, _ = ServiceCategory.objects.get_or_create(name='Da liễu', defaults={'clinic_type': 'daLieu'})
        cat2, _ = ServiceCategory.objects.get_or_create(name='Nha khoa', defaults={'clinic_type': 'nhaKhoa'})

        da_lieu_services = [
            ('Điều trị mụn', 1_500_000, 5),
            ('Trẻ hoá da', 3_000_000, 3),
            ('Triệt lông', 2_000_000, 6),
            ('Nâng cơ HIFU', 5_000_000, 1),
        ]
        nha_khoa_services = [
            ('Trám răng', 500_000, 1),
            ('Cạo vôi răng', 300_000, 1),
            ('Bọc sứ', 3_500_000, 2),
            ('Niềng răng', 25_000_000, 24),
        ]
        for name, price, sessions in da_lieu_services:
            Service.objects.get_or_create(
                category=cat1, name=name,
                defaults={'unit_price': price, 'sessions': sessions},
            )
        for name, price, sessions in nha_khoa_services:
            Service.objects.get_or_create(
                category=cat2, name=name,
                defaults={'unit_price': price, 'sessions': sessions},
            )
        self.stdout.write('  ✓ Services')
