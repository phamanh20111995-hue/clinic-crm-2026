# Hướng dẫn dùng Claude Code để build CRM

## Cài Claude Code (1 lần duy nhất)

```bash
# Cần Node.js 18+ trước
node --version  # Kiểm tra

# Cài Claude Code
npm install -g @anthropic-ai/claude-code

# Đăng nhập bằng tài khoản Claude.ai của bạn
claude login
```

## Bắt đầu build

```bash
# 1. Tạo thư mục project
mkdir clinic-crm && cd clinic-crm

# 2. Copy tất cả file vào đây
#    - Tất cả file từ bộ tài liệu này (CLAUDE.md, requirements.txt, ...)
#    - Tạo thư mục demo/ và copy 13 file HTML vào

# 3. Mở Claude Code
claude

# 4. Claude Code tự đọc CLAUDE.md — bắt đầu ra lệnh:
```

## Lệnh build theo thứ tự (copy paste từng lệnh)

### Sprint 1 — Nền tảng
```
Tạo project Django 5 với cấu trúc đúng theo CLAUDE.md. 
Tạo tất cả apps, settings (base/local/production), 
config urls.py, asgi.py cho WebSocket.
```

```
Tạo User model với 10 roles theo CLAUDE.md. 
Setup JWT auth với login/refresh/logout endpoints. 
Tạo custom permission classes cho từng role.
```

### Sprint 2 — Customer
```
Tạo tất cả models trong apps/customers/ theo CLAUDE.md.
Tạo đầy đủ API endpoints: list, create, detail, update, images, check-phone.
Implement filter: Sale chỉ thấy KH của mình.
```

```
Tạo CallHistory API. Implement hàng chờ Tele với filter.
Tạo ReturnRequest flow: submit → Leader duyệt → update KPI.
```

### Sprint 3 — Lễ tân
```
Tạo Appointment model và APIs theo CLAUDE.md.
Implement walk-in flow: check phone → có hồ sơ → checkin / không có → tạo mới.
Tạo room assignment API.
```

### Sprint 4 — Kế toán
```
Tạo Contract model với items/promotions/gifts dạng JSONField.
Implement approval flow: draft → pending_kt → approved.
Tạo DT dashboard API.
```

### Sprint 5 — Realtime
```
Setup Django Channels với Redis.
Implement WebSocket consumers cho chat và notifications.
Tạo tất cả notification types theo CLAUDE.md.
```

### Sprint 6 — Chấm công
```
Tạo attendance models và APIs.
Implement ZKTeco sync endpoint.
Tính toán late/early minutes tự động.
Tạo violation detection và notification.
```

### Sprint 7 — Frontend
```
Đọc file demo/crm_DEMO_HOAN_CHINH.html và tạo React app với Vite + Tailwind.
Convert từng module HTML thành React components, giữ nguyên thiết kế.
Implement React Router, JWT auth, API calls với axios.
```

### Sprint 8 — Deploy
```
Tạo docker-compose.prod.yml với Nginx, SSL, và production settings.
Tạo script deploy tự động.
Setup Celery beat cho nhắc lịch Zalo tự động hàng ngày.
```

## Mẹo dùng Claude Code hiệu quả

1. **Luôn để CLAUDE.md trong root** — Claude Code đọc file này trước mỗi lệnh
2. **Paste lỗi thẳng vào terminal** — Claude Code tự sửa
3. **Gõ `/clear` để reset context** khi chuyển sang sprint mới  
4. **Gõ `/review` để Claude Code review code vừa viết**
5. **Gõ `/test` để Claude Code tự viết và chạy test**

## Thời gian ước tính

| Sprint | Công việc | Thời gian thực (với Claude Code) |
|---|---|---|
| 1 | Django setup + Auth | 1–2 ngày |
| 2 | Customer + Tele | 2–3 ngày |
| 3 | Lễ tân + Appointment | 2–3 ngày |
| 4 | Kế toán + HĐ | 2–3 ngày |
| 5 | WebSocket + Chat | 2–3 ngày |
| 6 | Chấm công | 1–2 ngày |
| 7 | React Frontend | 3–5 ngày |
| 8 | Deploy | 1–2 ngày |
| **Tổng** | | **~2–3 tuần** |

> Không dùng Claude Code: 3–5 tháng
> Có Claude Code: **2–3 tuần** (nếu biết review code cơ bản)
