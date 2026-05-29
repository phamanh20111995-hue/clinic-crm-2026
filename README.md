# CRM Phòng Khám Da Liễu + Nha Khoa

## Yêu cầu
- Docker + Docker Compose
- Node.js 20+ (cho frontend)
- Claude Code (để AI-assisted development)

## Cài đặt nhanh (5 bước)

### Bước 1 — Cài Claude Code
```bash
npm install -g @anthropic-ai/claude-code
```

### Bước 2 — Clone project và copy demo
```bash
git clone <repo-url> clinic-crm
cd clinic-crm
# Copy toàn bộ 13 file HTML vào thư mục demo/
mkdir demo
cp /path/to/crm_*.html demo/
```

### Bước 3 — Cấu hình môi trường
```bash
cp .env.example .env
# Chỉnh sửa .env nếu cần (giữ mặc định cho local dev)
```

### Bước 4 — Khởi động với Docker
```bash
docker-compose up -d
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py seed_data
```

### Bước 5 — Mở và dùng
```
Backend API:  http://localhost:8000/api/
API Docs:     http://localhost:8000/api/docs/
Admin:        http://localhost:8000/admin/
Frontend:     http://localhost:3000/

Tài khoản demo:
  Quản lý:  admin / admin123
  Sale:     sale01 / demo123
  Tele:     tele01 / demo123
  Lễ tân:  letan01 / demo123
  Kế toán: ketoan01 / demo123
```

## Dùng Claude Code để build

```bash
# Mở Claude Code trong thư mục project
cd clinic-crm
claude

# Claude Code sẽ đọc CLAUDE.md tự động và hiểu toàn bộ dự án
# Gõ lệnh ví dụ:
> Build API endpoint cho hàng chờ Tele với filter theo role
> Implement WebSocket notification khi KH check-in
> Tạo migration cho bảng AttendanceRecord
> Convert file demo/crm_data_demo.html thành React component
```

## Cấu trúc thư mục

```
clinic-crm/
├── CLAUDE.md              ← Claude Code đọc file này trước
├── README.md
├── requirements.txt
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── demo/                  ← 13 file HTML demo giao diện
│   ├── crm_DEMO_HOAN_CHINH.html
│   ├── crm_data_demo.html
│   └── ...
├── config/                ← Django settings
│   ├── settings/
│   │   ├── base.py
│   │   ├── local.py
│   │   └── production.py
│   ├── urls.py
│   ├── asgi.py            ← WebSocket
│   └── celery.py          ← Task queue
├── apps/
│   ├── accounts/          ← User, RBAC, JWT
│   ├── customers/         ← KH, ảnh, lịch sử gọi, hoàn số
│   ├── appointments/      ← Lịch hẹn, phòng, tua
│   ├── contracts/         ← HĐ, KM, tặng kèm
│   ├── attendance/        ← Chấm công, ca, nghỉ phép
│   ├── salary/            ← Lương, tua
│   ├── kpi/               ← KPI 10 vai trò, phễu
│   ├── chat/              ← Chat nội bộ WebSocket
│   ├── notifications/     ← Thông báo realtime
│   └── integrations/      ← Zalo OA, ZKTeco
└── frontend/              ← React 18 + Vite + Tailwind
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── hooks/
    │   └── api/
    └── public/
        └── manifest.json  ← PWA
```

## Deploy production

```bash
# Server: Ubuntu 22.04 VPS (4GB RAM, 2 CPU)
# Khuyến nghị: DigitalOcean $24/tháng hoặc Vultr $20/tháng

# 1. Trỏ domain về IP server
# 2. Cài Docker trên server
# 3. Clone repo + cấu hình .env production
# 4. Chạy:
DEBUG=False docker-compose -f docker-compose.prod.yml up -d
```

## Tích hợp Zalo OA

1. Đăng ký Zalo OA tại https://oa.zalo.me
2. Tạo app tại https://developers.zalo.me
3. Điền ZALO_APP_ID và ZALO_APP_SECRET vào .env
4. Webhook URL: https://crm.phongkham.vn/api/integrations/zalo/webhook/

## Tích hợp máy chấm công ZKTeco

1. Cắm máy vào cùng mạng LAN với server
2. Tìm IP máy (thường 192.168.1.100)
3. Điền ZKTECO_HOST_1 vào .env
4. Kiểm tra: GET /api/integrations/zkteco/status/
