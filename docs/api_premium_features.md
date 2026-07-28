# PlanWise API Documentation

## Giới thiệu
API này cung cấp các endpoints cho ứng dụng PlanWise, bao gồm quản lý Mục tiêu (Goals), Thói quen (Habits), Danh mục (Categories),...

## Base URL
```
http://localhost:8080/api/v1
```

## Authentication
Tất cả các endpoints (ngoại trừ các endpoint public) yêu cầu JWT token trong header:
```
Authorization: Bearer <access_token>
```

---

## Authentication APIs (`/api/v1/auth`)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| POST | `/register` | Đăng ký tài khoản mới | No |
| POST | `/login` | Đăng nhập | No |
| POST | `/refresh` | Refresh access token | No |
| POST | `/logout` | Đăng xuất | Yes |
| GET | `/me` | Lấy thông tin user hiện tại | Yes |

---

## Subscription APIs (`/api/v1/subscriptions`)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/plans` | Lấy danh sách gói Premium | No |
| POST | `/purchase` | Tạo thanh toán Momo | Yes |
| POST | `/momo-ipn` | Webhook từ Momo | No |
| POST | `/verify` | Xác thực thanh toán | Yes |
| GET | `/transactions/{orderId}/status` | Kiểm tra trạng thái giao dịch | Yes |

---

## Goals APIs (`/api/v1/goals`)

### Giới hạn
- **FREE**: Tối đa **3 goals** (tổng cộng tất cả các kỳ hạn)
- **PREMIUM**: Không giới hạn

### Endpoints

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/` | Lấy tất cả goals | Yes |
| GET | `/?period={week\|month\|year}` | Lấy goals theo kỳ hạn | Yes |
| GET | `/{goalId}` | Lấy chi tiết một goal | Yes |
| POST | `/` | Tạo goal mới | Yes |
| PUT | `/{goalId}` | Cập nhật goal | Yes |
| DELETE | `/{goalId}` | Xóa goal | Yes |
| POST | `/{goalId}/increment-progress` | Tăng tiến độ 10% | Yes |

### Milestones

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/{goalId}/milestones` | Lấy milestones | Yes |
| POST | `/{goalId}/milestones` | Tạo milestone | Yes |
| PUT | `/{goalId}/milestones/{milestoneId}` | Cập nhật milestone | Yes |
| DELETE | `/{goalId}/milestones/{milestoneId}` | Xóa milestone | Yes |

### Request/Response Examples

**Create Goal Request:**
```json
{
  "title": "Hoàn thành khóa học React",
  "description": "Hoàn thành 100% khóa học React trong 2 tháng",
  "category": "learning",
  "goalType": "SMART",
  "period": "month",
  "targetDate": "2026-07-01",
  "color": "indigo"
}
```

**Goal List Response:**
```json
{
  "goals": [...],
  "totalCount": 3,
  "weeklyCount": 1,
  "monthlyCount": 1,
  "yearlyCount": 1,
  "isPremium": false,
  "freeLimit": 3
}
```

---

## Habits APIs (`/api/v1/habits`)

### Giới hạn
- **FREE**: Tối đa **3 habits**
- **PREMIUM**: Không giới hạn

### Endpoints

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/` | Lấy tất cả habits | Yes |
| GET | `/active` | Lấy habits đang hoạt động | Yes |
| GET | `/{habitId}` | Lấy chi tiết habit | Yes |
| POST | `/` | Tạo habit mới | Yes |
| PUT | `/{habitId}` | Cập nhật habit | Yes |
| DELETE | `/{habitId}` | Xóa habit | Yes |
| POST | `/{habitId}/toggle` | Toggle hoàn thành | Yes |
| POST | `/{habitId}/complete?date={date}` | Đánh dấu hoàn thành | Yes |
| DELETE | `/{habitId}/complete?date={date}` | Bỏ đánh dấu | Yes |

### Request/Response Examples

**Create Habit Request:**
```json
{
  "title": "Chạy bộ buổi sáng",
  "description": "Chạy bộ 30 phút mỗi sáng",
  "frequency": "daily",
  "targetCount": 1,
  "color": "emerald"
}
```

**Habit Response:**
```json
{
  "id": "uuid",
  "title": "Chạy bộ buổi sáng",
  "description": "Chạy bộ 30 phút mỗi sáng",
  "frequency": "daily",
  "targetCount": 1,
  "currentStreak": 5,
  "bestStreak": 10,
  "color": "emerald",
  "isActive": true,
  "sortOrder": 0,
  "completedDates": ["2026-05-27", "2026-05-28", "2026-05-29", "2026-05-30", "2026-05-31"],
  "createdAt": "2026-05-01T00:00:00Z",
  "updatedAt": "2026-05-31T00:00:00Z"
}
```

---

## Categories APIs (`/api/v1/categories`)

### Giới hạn
- **FREE**: Sử dụng 6 danh mục mặc định (không thể tạo thêm)
- **PREMIUM**: Tạo danh mục tùy chỉnh không giới hạn

### Danh mục mặc định
1. Công việc (indigo)
2. Dự án cá nhân (blue)
3. Sức khỏe (emerald)
4. Học tập (purple)
5. Gia đình (rose)
6. Tài chính (amber)

### Endpoints

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/` | Lấy tất cả categories | Yes |
| GET | `/{categoryId}` | Lấy chi tiết category | Yes |
| POST | `/` | Tạo category mới (Premium only) | Yes |
| PUT | `/{categoryId}` | Cập nhật category | Yes |
| DELETE | `/{categoryId}` | Xóa category (không xóa được default) | Yes |

### Request/Response Examples

**Create Category Request:**
```json
{
  "name": "Kỹ năng mới",
  "color": "teal"
}
```

**Category List Response:**
```json
{
  "categories": [...],
  "totalCount": 7,
  "defaultCount": 6,
  "customCount": 1,
  "isPremium": true,
  "freeLimit": 6
}
```

---

## Error Codes

| Code | HTTP Status | Mô tả |
|------|-------------|--------|
| GOAL_LIMIT_EXCEEDED | 403 | Đã đạt giới hạn 3 goals |
| HABIT_LIMIT_EXCEEDED | 403 | Đã đạt giới hạn 3 habits |
| CATEGORY_LIMIT_EXCEEDED | 403 | Không thể tạo thêm danh mục |
| GOAL_NOT_FOUND | 404 | Không tìm thấy goal |
| MILESTONE_NOT_FOUND | 404 | Không tìm thấy milestone |
| HABIT_NOT_FOUND | 404 | Không tìm thấy habit |
| CATEGORY_NOT_FOUND | 404 | Không tìm thấy category |
| CANNOT_DELETE_DEFAULT_CATEGORY | 400 | Không thể xóa danh mục mặc định |

---

## Color Options

Tất cả các entity hỗ trợ 8 màu sắc:

| Color | Hex |
|-------|-----|
| indigo | #6366f1 |
| blue | #3b82f6 |
| emerald | #10b981 |
| amber | #f59e0b |
| rose | #f43f5e |
| purple | #a855f7 |
| teal | #14b8a6 |
| orange | #f97316 |

---

## Premium Feature Comparison

| Tính năng | FREE | PREMIUM |
|-----------|------|---------|
| Goals | Tối đa 3 | Không giới hạn |
| Habits | Tối đa 3 | Không giới hạn |
| Custom Categories | Không | Không giới hạn |
| AI Chatbot | Giới hạn | Không giới hạn |
| VIP Badge | Không | Có |
