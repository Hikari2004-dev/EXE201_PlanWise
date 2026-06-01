# PlanWise – Database Design Documentation

## 🗃️ Lựa chọn Database: **PostgreSQL**

### Lý do chọn PostgreSQL thay vì MySQL

| Tiêu chí | PostgreSQL ✅ | MySQL |
|---|---|---|
| **JSON/JSONB** | Native JSONB với GIN index, query nhanh | JSON hỗ trợ nhưng kém hơn |
| **Full-text Search** | `tsvector`, `GIN index` tích hợp sẵn | Cần cấu hình thêm |
| **Array types** | Hỗ trợ `ARRAY[]`, `ANY()` | Không có native array |
| **Row Level Security** | ✅ RLS native, phù hợp Supabase | Không có RLS |
| **ENUM types** | Tường minh, type-safe | Có nhưng kém linh hoạt |
| **Window functions** | Mạnh hơn, cho analytics | Hỗ trợ nhưng kém tối ưu |
| **Triggers & Procedures** | Đầy đủ, `RETURNING` mạnh | OK nhưng phức tạp hơn |
| **Partial indexes** | ✅ Hỗ trợ (tiết kiệm dung lượng) | Không có |
| **Concurrency** | MVCC tốt hơn | Row-level lock |
| **Ecosystem** | Supabase, Neon, Railway | PlanetScale |

> **Kết luận**: PostgreSQL phù hợp hơn cho PlanWise vì ứng dụng cần **analytics phức tạp**, **full-text search** (tìm kiếm task/event), **RLS** (bảo mật multi-user), và tích hợp tốt với **Supabase** (backend-as-a-service phổ biến cho startup).

---

## 📐 Kiến trúc Database

### ERD - Sơ đồ quan hệ

```
users (1) ──────────────────── (*) categories
users (1) ──────────────────── (*) calendar_events
users (1) ──────────────────── (*) tasks
users (1) ──────────────────── (*) goals
users (1) ──────────────────── (*) habits
users (1) ──────────────────── (*) vision_items
users (1) ──────────────────── (*) daily_focus
users (1) ──────────────────── (*) daily_reflections
users (1) ──────────────────── (*) notifications
users (1) ─────────────────── (1) user_settings

categories (1) ─────────────── (*) calendar_events
categories (1) ─────────────── (*) tasks
categories (1) ─────────────── (*) goals

tasks (1) ──────────────────── (*) task_contexts
tasks (1) ──────────────────── (*) focus_sessions
tasks (*) ──────────────────── (*) daily_focus  [via daily_focus_tasks]

goals (1) ──────────────────── (*) milestones

habits (1) ─────────────────── (*) habit_completions

daily_focus (1) ────────────── (*) focus_sessions
daily_focus (1) ────────────── (*) quick_notes
daily_focus (1) ────────────── (*) daily_focus_tasks
```

---

## 📋 Chi tiết từng bảng

### 1. `users` – Người dùng
Bảng trung tâm của toàn hệ thống. Hỗ trợ đăng nhập thường và OAuth.

| Column | Type | Mô tả |
|---|---|---|
| `id` | UUID | PK, tự sinh |
| `email` | VARCHAR(255) | Email đăng nhập, unique |
| `password_hash` | VARCHAR | NULL nếu dùng OAuth |
| `language` | VARCHAR(10) | `'vi'` hoặc `'en'` (từ FE: DataContext toggleLanguage) |
| `timezone` | VARCHAR(50) | Múi giờ người dùng |

---

### 2. `categories` – Danh mục
Phân loại Task và CalendarEvent. Từ FE: `Category { id, name, color }`.

**6 danh mục mặc định** (seed khi user đăng ký):
- Công việc (indigo), Dự án cá nhân (blue), Sức khỏe (emerald)
- Học tập (purple), Gia đình (rose), Tài chính (amber)

---

### 3. `calendar_events` – Sự kiện lịch
Từ FE: `CalendarEvent { id, title, day, startHour, startMin, duration, color, location, notes, categoryId }`.

**Thay đổi quan trọng so với FE**:
- `day: string` (Mon/Tue) → `event_date: DATE` (chuẩn ISO date, không phụ thuộc vào tuần hiện tại)
- Thêm `is_recurring` và `recurrence_rule` cho sự kiện lặp lại (iCal RRULE)

---

### 4. `tasks` – Công việc
Từ FE: `Task { id, title, categoryId, dueDate, priority, completed, color, description, eisenhowerMatrix, context[], estimatedTime }`.

**Thay đổi quan trọng**:
- `dueDate: string` ("14 Th3") → `due_date: DATE` (chuẩn ISO)
- `context: string[]` → bảng riêng `task_contexts` (chuẩn hóa)
- Thêm `actual_time` (tự động tính từ focus sessions via trigger)
- Thêm `completed_at` (timestamp khi hoàn thành)

---

### 5. `goals` – Mục tiêu
Từ FE: `Goal { id, title, description, category, type, targetDate, progress, milestones[], color }`.

**Mở rộng thêm**:
- `period: goal_period` (week/month/year) để phân loại theo GoalsView (Mục tiêu Tuần/Tháng/Năm)
- Tách `milestones` thành bảng riêng

---

### 6. `habits` + `habit_completions` – Thói quen
Từ FE: `Habit { id, title, description, frequency, targetCount, currentStreak, bestStreak, color, completedDates[] }`.

**Thay đổi quan trọng**:
- `completedDates: string[]` → bảng `habit_completions(habit_id, completed_date)` riêng
- Dễ query: "Đã hoàn thành trong 7 ngày qua?", "Chuỗi hiện tại là bao nhiêu?"

---

### 7. `daily_focus` + `focus_sessions` + `quick_notes`
Từ FE: `DailyFocus { id, date, topTasks[], focusSessions[], quickNotes[] }`.

Tách thành 3 bảng riêng:
- `daily_focus`: 1 record/ngày/user
- `daily_focus_tasks`: junction table với tasks
- `focus_sessions`: Pomodoro/Sprint/Deep Work sessions
- `quick_notes`: Ghi chú nhanh text/voice/image

---

### 8. `daily_reflections` – Nhật ký cuối ngày
Từ FE: `DailyReflection { id, date, completed, obstacles, improvements, energyLevel, mood }`.

---

### 9. `notifications` – Thông báo
Từ FE: `NotificationCenter.tsx – NotificationItem { id, type, tone, title, message, cta, taskId?, habitId?, goalId? }`.

---

### 10. `ai_chat_messages` – Lịch sử Coach AI
Từ FE: `Chatbot.tsx – Message { id, sender, text }`.

Thêm `metadata: JSONB` để lưu action đã thực hiện (addTask, addEvent,...).

---

## ⚡ Performance Optimizations

### Indexes
- **Composite indexes**: `(user_id, due_date)`, `(user_id, completed_date)` cho query phổ biến
- **Partial indexes**: `WHERE completed = FALSE` – chỉ index task chưa hoàn thành
- **GIN indexes**: Full-text search cho title và description của tasks/events
- **BRIN indexes**: Có thể thêm cho các timestamp column nếu data lớn

### Denormalization
- `weekly_analytics_snapshots`: Snapshot thống kê tuần được tính trước (job định kỳ), tránh heavy aggregation query mỗi lần load Analytics view

---

## 🔐 Security

### Row Level Security (RLS)
Tất cả bảng dữ liệu người dùng đều có RLS enabled. Với **Supabase**, thêm policy:
```sql
CREATE POLICY "users_own_data" ON tasks
    FOR ALL USING (user_id = auth.uid());
```

### Sensitive Data
- Password lưu dạng hash (bcrypt/argon2)
- OAuth tokens lưu encrypted (pgcrypto)
- Không lưu plaintext passwords

---

## 🚀 Recommended Stack

```
PostgreSQL (v15+)
│
├── Supabase (nếu startup, cần nhanh)
│   ├── Auth (OAuth tích hợp)
│   ├── RLS policy
│   └── Real-time subscriptions
│
└── Railway / Neon / Render (nếu tự host)
    ├── NestJS / Express backend
    ├── Prisma ORM (type-safe schema)
    └── Connection pooling (PgBouncer)
```

---

## 📁 Files

| File | Mô tả |
|---|---|
| `schema.sql` | DDL đầy đủ: Tables, Enums, Indexes, Triggers, Views, RLS |
| `README.md` | Tài liệu thiết kế này |

---

## 🔄 Migration Strategy

1. Sử dụng **Prisma Migrate** hoặc **Flyway** để version control schema
2. Production: Zero-downtime migrations (thêm column, không đổi tên)
3. Backup định kỳ: `pg_dump` với cron job

---

*Phân tích từ FE codebase: `mockData.ts`, `DataContext.tsx`, `TasksView.tsx`, `GoalsView.tsx`, `HabitsView.tsx`, `AnalyticsView.tsx`, `NotificationCenter.tsx`, `Chatbot.tsx`*
