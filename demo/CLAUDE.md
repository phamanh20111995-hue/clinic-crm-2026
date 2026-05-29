# CLAUDE.md — CRM Phòng Khám Da Liễu + Nha Khoa

## TỔNG QUAN DỰ ÁN

CRM nội bộ cho 2 phòng khám (Da Liễu + Nha Khoa) tại Hà Nội.
Thay thế Getfly CRM. Stack: Django 5 + PostgreSQL + Redis + React + PWA.

Demo giao diện: 13 file HTML trong thư mục `demo/` — ĐỌC KỸ trước khi code.
Mọi nghiệp vụ, RBAC, luồng dữ liệu đã được xác nhận trong demo.

## TECH STACK

```
Backend:    Django 5.0 + Django REST Framework
Database:   PostgreSQL 16
Cache:      Redis 7
Realtime:   Django Channels + WebSocket (chat, thông báo)
Auth:       JWT (djangorestframework-simplejwt)
Frontend:   React 18 + Vite + TailwindCSS (convert từ HTML demo)
Mobile:     PWA (manifest + service worker)
Deploy:     Docker + Nginx + Gunicorn
Zalo:       Zalo OA API v3
Chấm công: ZKTeco API (REST)
```

## 10 VAI TRÒ RBAC

```python
ROLES = [
    'QUAN_LY',      # Xem tất cả, duyệt mọi thứ
    'CHU_DN',       # Như Quản lý + xem báo cáo tài chính tổng
    'LEAD_SALE',    # Quản lý team Sale + xem KPI Sale
    'LEAD_TELE',    # Quản lý team Tele + duyệt hoàn số
    'LEAD_CSKH',    # Quản lý team CSKH
    'SALE',         # Xem KH của mình, tạo HĐ
    'TELE',         # Gọi điện, ghi KQ, hàng chờ
    'CSKH',         # Liệu trình, nhắc lịch, đánh giá
    'LE_TAN',       # Sơ đồ phòng, check-in, walk-in
    'KE_TOAN',      # Duyệt HĐ, DT, công nợ, lương, chấm công
]
```

## PHÂN QUYỀN HỒ SƠ KH

```
Full (5 tab): QUAN_LY, CHU_DN, LEAD_SALE, LEAD_TELE, KE_TOAN, LE_TAN, LEAD_CSKH, CSKH
Giới hạn:     SALE — chỉ xem KH do mình phụ trách (sale_id = request.user.id)
Bị chặn:      TELE, MKT, DATA, TRUC_PAGE
```

## CẤU TRÚC DATABASE

### apps/accounts/models.py
```python
class User(AbstractUser):
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    phone = models.CharField(max_length=15, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Clinic(models.Model):
    name = models.CharField(max_length=200)  # Da Liễu / Nha Khoa
    address = models.TextField()
    phone = models.CharField(max_length=15)
```

### apps/customers/models.py
```python
class Customer(models.Model):
    # Thông tin cơ bản
    full_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=15, unique=True)
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=[('M','Nam'),('F','Nữ')])
    address = models.TextField(blank=True)
    
    # Nguồn data
    SOURCE_CHOICES = [
        ('facebook','Facebook'), ('tiktok','TikTok'), ('zalo','Zalo'),
        ('google','Google/Maps'), ('instagram','Instagram'),
        ('gioi_thieu','Giới thiệu'), ('walkin','Walk-in'), ('khac','Không xác định'),
    ]
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    
    # Phân loại
    DATA_TYPE_CHOICES = [('nong','Nóng'), ('am','Âm'), ('thuong','Thường')]
    data_type = models.CharField(max_length=10, choices=DATA_TYPE_CHOICES, default='thuong')
    
    # Phân quyền
    sale = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL,
                              related_name='customers', limit_choices_to={'role':'SALE'})
    tele = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL,
                              related_name='tele_customers', limit_choices_to={'role':'TELE'})
    
    # Trạng thái
    STATUS_CHOICES = [
        ('chua_goi','Chưa gọi'), ('da_goi','Đã gọi'),
        ('khong_nghe','Không nghe máy'), ('thue_bao','Thuê bao'),
        ('sai_so','Sai số'), ('tu_choi','Từ chối'), ('hoan_so','Hoàn số'),
        ('dat_lich','Đặt lịch'), ('hen_goi','Hẹn gọi lại'),
        ('can_tv','Cần tư vấn thêm'), ('khong_qt','Không quan tâm'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='chua_goi')
    call_count = models.IntegerField(default=0)  # Lần gọi 1-20
    
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_customers')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class CustomerImage(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='customer_images/%Y/%m/')
    IMAGE_TYPE_CHOICES = [('truoc','Trước ĐT'), ('trong','Trong ĐT'), ('sau','Sau ĐT'), ('tinh_trang','Tình trạng')]
    image_type = models.CharField(max_length=20, choices=IMAGE_TYPE_CHOICES)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

class CallHistory(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='calls')
    tele = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    call_number = models.IntegerField()  # Lần 1-20
    result = models.CharField(max_length=20, choices=Customer.STATUS_CHOICES)
    consult_result = models.CharField(max_length=20, blank=True)
    notes = models.TextField(blank=True)
    recording_file = models.FileField(upload_to='recordings/', blank=True)  # File ghi âm cho hoàn số
    called_at = models.DateTimeField(auto_now_add=True)

class ReturnRequest(models.Model):
    """Yêu cầu hoàn số — cần Leader duyệt"""
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    requested_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='return_requests')
    reason = models.TextField()
    recording_file = models.FileField(upload_to='recordings/')
    REASON_CHOICES = [
        ('treu','KH trêu / số ảo'), ('khong_ton_tai','Số không tồn tại'),
        ('nham_so','Không nhớ để lại số'), ('trung','Số trùng KH cũ'),
    ]
    reason_type = models.CharField(max_length=20, choices=REASON_CHOICES)
    STATUS_CHOICES = [('pending','Chờ duyệt'), ('approved','Đã duyệt'), ('rejected','Từ chối')]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_returns')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### apps/appointments/models.py
```python
class Appointment(models.Model):
    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE)
    scheduled_at = models.DateTimeField()
    service = models.ForeignKey('services.Service', on_delete=models.SET_NULL, null=True)
    booked_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='booked_appointments')
    STATUS_CHOICES = [
        ('pending','Chờ đến'), ('confirmed','Xác nhận đến'),
        ('in_progress','Đang điều trị'), ('done','Hoàn thành'), ('cancelled','Hủy'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    room = models.ForeignKey('clinics.Room', null=True, blank=True, on_delete=models.SET_NULL)
    doctor = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='doctor_appointments')
    ktv = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='ktv_appointments')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_walkin = models.BooleanField(default=False)
    tua_confirmed = models.BooleanField(default=False)
    tua_confirmed_via_zalo = models.BooleanField(default=False)
```

### apps/contracts/models.py
```python
class Contract(models.Model):
    contract_no = models.CharField(max_length=20, unique=True)  # HĐ-2026-001
    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE)
    appointment = models.ForeignKey('appointments.Appointment', null=True, blank=True, on_delete=models.SET_NULL)
    
    # Dịch vụ
    items = models.JSONField(default=list)  # [{service_id, name, sessions, price, discount}]
    promotions = models.JSONField(default=list)  # KM inline
    gifts = models.JSONField(default=list)  # Tặng kèm inline
    
    # Tài chính
    total_amount = models.DecimalField(max_digits=15, decimal_places=0)
    discount_amount = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    final_amount = models.DecimalField(max_digits=15, decimal_places=0)
    
    PAYMENT_METHOD_CHOICES = [('cash','Tiền mặt'), ('transfer','Chuyển khoản'), ('combined','Kết hợp')]
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    cash_amount = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    transfer_amount = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    
    PAYMENT_STATUS_CHOICES = [('pending','Chưa nhận'), ('received','Đã nhận'), ('partial','Nhận một phần')]
    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS_CHOICES, default='pending')
    
    # Trạng thái duyệt
    APPROVAL_STATUS_CHOICES = [('draft','Nháp'), ('pending_kt','Chờ KT duyệt'), ('approved','Đã duyệt'), ('rejected','Từ chối')]
    approval_status = models.CharField(max_length=15, choices=APPROVAL_STATUS_CHOICES, default='draft')
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_contracts')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_contracts')
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
```

### apps/attendance/models.py
```python
class WorkShift(models.Model):
    """Ca làm việc"""
    SHIFT_CHOICES = [('sang','Sáng 08-12'), ('chieu','Chiều 12-17'), ('toi','Tối 17-20'), ('full','Full 08-17')]
    name = models.CharField(max_length=10, choices=SHIFT_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    allowed_late_minutes = models.IntegerField(default=5)

class ShiftAssignment(models.Model):
    """Phân ca nhân viên"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    shift = models.ForeignKey(WorkShift, on_delete=models.CASCADE)
    date = models.DateField()
    
    class Meta:
        unique_together = ['user', 'date', 'shift']

class AttendanceRecord(models.Model):
    """Dữ liệu từ máy chấm công ZKTeco"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    late_minutes = models.IntegerField(default=0)
    early_minutes = models.IntegerField(default=0)
    STATUS_CHOICES = [('on_time','Đúng giờ'), ('late','Đi muộn'), ('early','Về sớm'), ('absent','Vắng mặt'), ('leave','Nghỉ phép')]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    source = models.CharField(max_length=10, choices=[('machine','Máy CC'), ('manual','Thủ công')], default='machine')
    manual_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class LeaveRequest(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    LEAVE_TYPE_CHOICES = [('annual','Phép năm'), ('unpaid','Không lương'), ('sick','Phép bệnh')]
    leave_type = models.CharField(max_length=10, choices=LEAVE_TYPE_CHOICES)
    reason = models.TextField()
    STATUS_CHOICES = [('pending','Chờ duyệt'), ('approved','Đã duyệt'), ('rejected','Từ chối')]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_leaves')
    created_at = models.DateTimeField(auto_now_add=True)
```

### apps/salary/models.py
```python
class SalaryConfig(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    base_salary = models.DecimalField(max_digits=12, decimal_places=0)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # % hoa hồng
    tua_rate = models.DecimalField(max_digits=8, decimal_places=0, default=0)  # Tiền/tua

class MonthlySalary(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    month = models.IntegerField()
    year = models.IntegerField()
    working_days = models.IntegerField()
    base = models.DecimalField(max_digits=12, decimal_places=0)
    commission = models.DecimalField(max_digits=12, decimal_places=0, default=0)
    tua_income = models.DecimalField(max_digits=12, decimal_places=0, default=0)
    deductions = models.DecimalField(max_digits=12, decimal_places=0, default=0)  # Trừ vi phạm
    total = models.DecimalField(max_digits=12, decimal_places=0)
    STATUS_CHOICES = [('draft','Nháp'), ('approved','Đã duyệt'), ('paid','Đã thanh toán')]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    class Meta:
        unique_together = ['user', 'month', 'year']
```

### apps/chat/models.py
```python
class ChatChannel(models.Model):
    CHANNEL_TYPES = [('group','Nhóm'), ('direct','Trực tiếp')]
    channel_type = models.CharField(max_length=10, choices=CHANNEL_TYPES)
    name = models.CharField(max_length=100, blank=True)  # Cho nhóm
    members = models.ManyToManyField(User, related_name='channels')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Message(models.Model):
    channel = models.ForeignKey(ChatChannel, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    content = models.TextField(blank=True)
    MESSAGE_TYPES = [('text','Text'), ('file','File'), ('image','Ảnh'), ('system','Hệ thống'), ('kh_share','Chia sẻ KH'), ('hd_share','Chia sẻ HĐ')]
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='text')
    file = models.FileField(upload_to='chat_files/', blank=True)
    metadata = models.JSONField(default=dict)  # {customer_id, contract_id, ...}
    is_pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
```

## API ENDPOINTS CHÍNH

```
AUTH
POST   /api/auth/login/          JWT login
POST   /api/auth/refresh/        Refresh token
POST   /api/auth/logout/

CUSTOMERS
GET    /api/customers/           Danh sách KH (filter theo role tự động)
POST   /api/customers/           Tạo KH mới
GET    /api/customers/{id}/      Chi tiết KH
PUT    /api/customers/{id}/      Cập nhật
POST   /api/customers/{id}/images/   Upload ảnh
GET    /api/customers/check-phone/?phone=  Kiểm tra trùng SĐT

CALLS
GET    /api/calls/queue/          Hàng chờ Tele
POST   /api/calls/               Ghi KQ gọi
POST   /api/calls/return-request/ Yêu cầu hoàn số
POST   /api/calls/return-request/{id}/approve/

APPOINTMENTS
GET    /api/appointments/today/   Lịch hẹn hôm nay
POST   /api/appointments/         Tạo lịch hẹn
PUT    /api/appointments/{id}/    Cập nhật
POST   /api/appointments/{id}/checkin/   Check-in KH
POST   /api/appointments/{id}/confirm-tua/  Xác nhận tua

CONTRACTS
GET    /api/contracts/            Danh sách HĐ
POST   /api/contracts/            Tạo HĐ nháp
POST   /api/contracts/{id}/submit/    Submit lên KT duyệt
POST   /api/contracts/{id}/approve/   KT duyệt
POST   /api/contracts/{id}/reject/    KT từ chối

ATTENDANCE
GET    /api/attendance/today/     Chấm công hôm nay
GET    /api/attendance/monthly/   Bảng công tháng
POST   /api/attendance/sync/      Sync từ máy ZKTeco
POST   /api/attendance/manual/    Chỉnh công thủ công (KT)
GET    /api/shifts/               Lịch ca
POST   /api/shifts/               Thêm ca
GET    /api/leaves/               Danh sách phép
POST   /api/leaves/               Xin nghỉ phép
POST   /api/leaves/{id}/approve/

SALARY
GET    /api/salary/monthly/       Bảng lương tháng
POST   /api/salary/calculate/     Tính lương tự động
POST   /api/salary/{id}/approve/

KPI
GET    /api/kpi/dashboard/        KPI tổng hợp (filter role)
GET    /api/kpi/tele/             KPI Tele
GET    /api/kpi/sale/             KPI Sale
GET    /api/kpi/truc-page/        KPI Trực page + phễu

CHAT (WebSocket)
WS     /ws/chat/{channel_id}/
GET    /api/chat/channels/
POST   /api/chat/channels/
GET    /api/chat/channels/{id}/messages/
POST   /api/chat/channels/{id}/messages/

NOTIFICATIONS (WebSocket)
WS     /ws/notifications/

INTEGRATIONS
POST   /api/integrations/zalo/webhook/   Zalo OA webhook
POST   /api/integrations/zkteco/sync/    Sync máy chấm công
GET    /api/integrations/zkteco/status/  Trạng thái kết nối
```

## LUỒNG NGHIỆP VỤ QUAN TRỌNG

### 1. Luồng Data → Tele → Đặt lịch
```
Trực page nhập data (phone check unique) 
→ customer.status = 'chua_goi'
→ Tele nhận data trong hàng chờ (filter by tele assigned)
→ Tele gọi → POST /api/calls/ {call_number, result, consult_result}
→ Nếu result='dat_lich' → tự tạo Appointment
→ Nếu result='hoan_so' → tạo ReturnRequest + upload recording
→ Lead Tele duyệt ReturnRequest → data trả về Trực page
```

### 2. Luồng Walk-in
```
Lễ tân check SĐT → GET /api/customers/check-phone/
→ Có hồ sơ: POST /api/appointments/{id}/checkin/ → status='confirmed'
→ Không có: tạo Customer mới (source='walkin') + tạo Appointment
→ Tele nhận thông báo realtime qua WebSocket
→ Lễ tân phân phòng → appointment.room = room_id
→ BS/KTV nhận thông báo
```

### 3. Luồng HĐ
```
Sale/CSKH tạo HĐ nháp → approval_status='draft'
→ POST /api/contracts/{id}/submit/ → status='pending_kt'
→ KT nhận notification realtime
→ KT duyệt → status='approved' → DT ghi chính thức
→ Nếu CK: KT xác nhận đã nhận tiền riêng
```

### 4. Luồng Tua (Xác nhận ca điều trị)
```
Kết thúc buổi điều trị → Lễ tân tính tua
→ Gửi Zalo link xác nhận → KH bấm xác nhận
→ appointment.tua_confirmed = True
→ Kế toán ghi nhận tua → tính lương BS/KTV
```

### 5. Luồng Chấm công
```
Máy ZKTeco đồng bộ API mỗi 5 phút → POST /api/integrations/zkteco/sync/
→ So sánh với ShiftAssignment → tính late_minutes
→ Nếu muộn >= 3 lần/tháng → tạo vi phạm → KT xử lý → trừ lương
→ Vắng mặt: gửi notification cho QL + KT
```

## REALTIME (DJANGO CHANNELS)

```python
# Các event WebSocket cần implement:
NOTIFICATION_TYPES = {
    'kh_checkin': 'KH {name} vừa check-in lúc {time}',
    'hd_pending_kt': 'HĐ {no} chờ KT duyệt - Sale {name}',
    'hd_approved': 'HĐ {no} đã được duyệt',
    'return_request': 'Yêu cầu hoàn số từ Tele {name}',
    'data_hot': 'Data nóng: {name} vừa tương tác',
    'absence_alert': '{name} vắng mặt ca {shift} chưa có phép',
    'appointment_reminder': 'KH {name} có lịch hẹn lúc {time}',
    'chat_message': 'Tin nhắn mới từ {sender}',
}
```

## ZALO OA INTEGRATION

```python
# Nhắc lịch tự động (1 ngày trước)
def send_appointment_reminder(appointment):
    message = f"Xin chào {appointment.customer.full_name}! PK nhắc lịch hẹn ngày mai {appointment.scheduled_at.strftime('%d/%m')} lúc {appointment.scheduled_at.strftime('%H:%M')}. Dịch vụ: {appointment.service.name}"
    zalo_api.send_message(appointment.customer.zalo_id, message)

# Link xác nhận tua
def send_tua_confirmation(appointment):
    link = f"https://crm.phongkham.vn/confirm-tua/{appointment.token}/"
    zalo_api.send_message(appointment.customer.zalo_id, f"Vui lòng xác nhận ca điều trị: {link}")

# CSKH nhắc tái khám
def send_recheck_reminder(treatment_plan):
    zalo_api.send_message(...)
```

## CÀI ĐẶT VÀ CHẠY LOCAL

```bash
# 1. Clone và setup
git clone <repo>
cd clinic-crm

# 2. Chạy với Docker (khuyến nghị)
docker-compose up -d

# 3. Hoặc chạy thủ công
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Điền thông tin DB, Redis, Zalo OA

# 4. Migrate và tạo data mẫu
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_data  # Tạo roles, dịch vụ mẫu, tài khoản demo

# 5. Chạy server
python manage.py runserver  # Django dev server
# hoặc
daphne -p 8000 config.asgi:application  # Với WebSocket
```

## THỨ TỰ BUILD (QUAN TRỌNG)

```
Sprint 1 (2 tuần): Auth + User + RBAC + API cơ bản
Sprint 2 (2 tuần): Customer CRUD + Call history + Hàng chờ Tele  
Sprint 3 (2 tuần): Appointment + Lễ tân + Sơ đồ phòng + Walk-in
Sprint 4 (2 tuần): Contract + KT duyệt + Tài chính
Sprint 5 (2 tuần): WebSocket notifications + Chat nội bộ
Sprint 6 (1 tuần): Chấm công ZKTeco + Ca làm việc
Sprint 7 (1 tuần): Lương & Tua + KPI dashboard
Sprint 8 (1 tuần): Zalo OA + PWA + Deploy production
```

## LƯU Ý KỸ THUẬT

1. **RBAC**: Dùng custom permission classes, KHÔNG dùng Django built-in permissions
2. **Sale filter**: Mọi QuerySet Customer với SALE role PHẢI thêm `.filter(sale=request.user)`
3. **Soft delete**: Không xóa cứng Customer, Contract — dùng `is_deleted=True`
4. **Audit log**: Mọi thay đổi quan trọng (HĐ, lương, chấm công thủ công) phải ghi log
5. **File upload**: Dùng S3-compatible storage (MinIO local, AWS S3 production)
6. **Phone unique**: Kiểm tra trùng SĐT ở cả frontend và backend
7. **Demo HTML**: 13 file trong `demo/` là spec giao diện chính xác — convert sang React theo đúng thiết kế

