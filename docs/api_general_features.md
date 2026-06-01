# PlanWise API Documentation

## Base URL
```
http://localhost:8080/api/v1
```

## Authentication
All endpoints (except `/api/v1/auth/*`) require JWT authentication via Bearer token.

## Table of Contents
1. [Tasks API](#1-tasks-api)
2. [Calendar Events API](#2-calendar-events-api)
3. [Focus Sessions API](#3-focus-sessions-api)
4. [Daily Focus API](#4-daily-focus-api)
5. [Quick Notes API](#5-quick-notes-api)
6. [Daily Reflections API](#6-daily-reflections-api)
7. [Vision Items API](#7-vision-items-api)
8. [Notifications API](#8-notifications-api)
9. [User Settings API](#9-user-settings-api)

---

## 1. Tasks API

### GET /api/v1/tasks
Get all tasks for the authenticated user.

**Response:**
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Hoàn thành báo cáo tuần",
      "description": "Tổng hợp kết quả công việc",
      "dueDate": "2026-03-14",
      "priority": "Cao",
      "color": "indigo",
      "completed": false,
      "completedAt": null,
      "eisenhowerMatrix": "urgent-important",
      "estimatedTime": 120,
      "actualTime": null,
      "contexts": ["Tại máy tính"],
      "categoryId": "uuid",
      "categoryName": "Công việc",
      "categoryColor": "indigo",
      "sortOrder": 0,
      "createdAt": "2026-03-01T10:00:00Z",
      "updatedAt": "2026-03-01T10:00:00Z"
    }
  ],
  "totalCount": 11,
  "pendingCount": 8,
  "completedCount": 3,
  "overdueCount": 2
}
```

### GET /api/v1/tasks/{taskId}
Get a specific task by ID.

### POST /api/v1/tasks
Create a new task.

**Request Body:**
```json
{
  "title": "Hoàn thành báo cáo",
  "description": "Tổng hợp kết quả tuần này",
  "dueDate": "2026-03-14",
  "priority": "Cao",
  "color": "indigo",
  "categoryId": "uuid",
  "eisenhowerMatrix": "urgent-important",
  "estimatedTime": 120,
  "contexts": ["Tại máy tính", "Tập trung sâu"]
}
```

### PUT /api/v1/tasks/{taskId}
Update a task.

### POST /api/v1/tasks/{taskId}/toggle
Toggle task completion status.

### DELETE /api/v1/tasks/{taskId}
Delete a task.

---

## 2. Calendar Events API

### GET /api/v1/events
Get all events. Supports optional date filtering.

**Query Parameters:**
- `date` - Filter by specific date (e.g., `2026-03-15`)
- `startDate` & `endDate` - Filter by date range

### GET /api/v1/events/{eventId}
Get a specific event.

### POST /api/v1/events
Create a new calendar event.

**Request Body:**
```json
{
  "title": "Họp team",
  "eventDate": "2026-03-15",
  "startHour": 13,
  "startMin": 0,
  "duration": 1.5,
  "color": "indigo",
  "location": "Phòng họp A",
  "notes": "Thảo luận kế hoạch tuần mới",
  "categoryId": "uuid",
  "isRecurring": false,
  "recurrenceRule": null
}
```

### PUT /api/v1/events/{eventId}
Update an event.

### DELETE /api/v1/events/{eventId}
Delete an event.

---

## 3. Focus Sessions API

### GET /api/v1/focus/sessions
Get all focus sessions.

### POST /api/v1/focus/sessions
Start a new focus session.

**Request Body:**
```json
{
  "startTime": "2026-03-15T09:00:00Z",
  "duration": 25,
  "sessionType": "pomodoro",
  "taskId": "uuid",
  "notes": null
}
```

### POST /api/v1/focus/sessions/{sessionId}/complete
Mark a focus session as completed.

---

## 4. Daily Focus API

### GET /api/v1/focus/daily
Get daily focus data for a specific date.

**Query Parameters:**
- `date` - The date to get focus data for (defaults to today)

**Response:**
```json
{
  "id": "uuid",
  "focusDate": "2026-03-15",
  "notes": "Priorities for today",
  "topTaskIds": ["uuid1", "uuid2", "uuid3"],
  "quickNotes": [...],
  "focusSessions": [...],
  "createdAt": "2026-03-15T00:00:00Z",
  "updatedAt": "2026-03-15T10:00:00Z"
}
```

### POST /api/v1/focus/daily/top-tasks
Add a task to top priorities.

**Query Parameters:**
- `date` - The date
- `taskId` - The task ID to add

### DELETE /api/v1/focus/daily/top-tasks
Remove a task from top priorities.

### PUT /api/v1/focus/daily/notes
Update daily notes.

---

## 5. Quick Notes API

### GET /api/v1/focus/notes
Get all quick notes for the user.

**Response:**
```json
[
  {
    "id": "uuid",
    "content": "Nhớ gọi khách hàng ABC",
    "noteType": "text",
    "mediaUrl": null,
    "createdAt": "2026-03-15T10:30:00Z"
  }
]
```

### POST /api/v1/focus/notes
Create a new quick note.

**Request Body:**
```json
{
  "content": "Nhớ gọi khách hàng ABC",
  "noteType": "text",
  "mediaUrl": null
}
```

### DELETE /api/v1/focus/notes/{noteId}
Delete a quick note.

---

## 6. Daily Reflections API

### GET /api/v1/reflections
Get all reflections.

### GET /api/v1/reflections/today
Get today's reflection.

### GET /api/v1/reflections/date
Get reflection for a specific date.

**Query Parameters:**
- `date` - The date to get reflection for

### POST /api/v1/reflections
Create or update a reflection (upsert by date).

**Request Body:**
```json
{
  "reflectionDate": "2026-03-15",
  "completed": "Hoàn thành báo cáo, học tiếng Anh",
  "obstacles": "Bị phân tâm bởi social media",
  "improvements": "Tắt thông báo khi làm việc",
  "energyLevel": 7,
  "mood": "good"
}
```

### PUT /api/v1/reflections/{reflectionId}
Update an existing reflection.

---

## 7. Vision Items API

### GET /api/v1/vision
Get all vision board items.

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Thành công trong sự nghiệp",
    "description": "Trở thành Senior Developer",
    "category": "career",
    "imageUrl": "https://...",
    "quote": "Success is not final, failure is not fatal",
    "sortOrder": 0,
    "createdAt": "2026-03-01T10:00:00Z",
    "updatedAt": "2026-03-01T10:00:00Z"
  }
]
```

### POST /api/v1/vision
Create a new vision item.

**Request Body:**
```json
{
  "title": "Thành công trong sự nghiệp",
  "description": "Trở thành Senior Developer",
  "category": "career",
  "imageUrl": "https://...",
  "quote": "Success is not final, failure is not fatal"
}
```

### PUT /api/v1/vision/{itemId}
Update a vision item.

### DELETE /api/v1/vision/{itemId}
Delete a vision item.

---

## 8. Notifications API

### GET /api/v1/notifications
Get all notifications for the user.

**Response:**
```json
[
  {
    "id": "uuid",
    "type": "time",
    "tone": "indigo",
    "title": "Nhắc nhở: Họp team",
    "message": "Bạn có cuộc họp sau 15 phút",
    "ctaLabel": "Xem chi tiết",
    "read": false,
    "dismissed": false,
    "scheduledFor": "2026-03-15T13:00:00Z",
    "createdAt": "2026-03-15T12:45:00Z"
  }
]
```

### GET /api/v1/notifications/unread-count
Get count of unread notifications.

### POST /api/v1/notifications/{notificationId}/read
Mark a notification as read.

### POST /api/v1/notifications/read-all
Mark all notifications as read.

### DELETE /api/v1/notifications/{notificationId}
Dismiss a notification.

### DELETE /api/v1/notifications/dismiss-all
Dismiss all notifications.

---

## 9. User Settings API

### GET /api/v1/settings
Get user settings.

**Response:**
```json
{
  "theme": "light",
  "defaultFocusType": "POMODORO",
  "pomodoroDuration": 25,
  "shortBreakDuration": 5,
  "longBreakDuration": 15,
  "dailyTaskLimit": 10,
  "notificationEnabled": true,
  "emailDigestEnabled": false,
  "emailDigestTime": "08:00:00",
  "onboardingCompleted": true
}
```

### PUT /api/v1/settings
Update user settings.

**Request Body:**
```json
{
  "theme": "dark",
  "defaultFocusType": "DEEP_WORK",
  "pomodoroDuration": 25,
  "shortBreakDuration": 5,
  "longBreakDuration": 15,
  "dailyTaskLimit": 10,
  "notificationEnabled": true,
  "emailDigestEnabled": true,
  "emailDigestTime": "08:00:00",
  "onboardingCompleted": true
}
```

---

## Enums Reference

### Task Priority
- `Cao` (High)
- `Trung bình` (Medium)
- `Thấp` (Low)

### Eisenhower Matrix
- `urgent-important` - Khẩn cấp & Quan trọng
- `not-urgent-important` - Quan trọng & Không khẩn cấp
- `urgent-not-important` - Khẩn cấp & Không quan trọng
- `not-urgent-not-important` - Không khẩn cấp & Không quan trọng

### Focus Session Type
- `POMODORO` - Pomodoro (25 phút)
- `FLOWTIME` - Flowtime
- `DEEP_WORK` - Deep Work (90 phút)

### Mood Type
- `great` - Tuyệt vời
- `good` - Tốt
- `okay` - Bình thường
- `bad` - Không tốt
- `terrible` - Rất tệ

### Notification Type
- `time` - Nhắc giờ
- `deadline` - Hạn chót
- `habit` - Thói quen
- `progress` - Tiến độ
- `goal` - Mục tiêu

### Event Color
- `indigo`, `blue`, `emerald`, `amber`, `rose`, `purple`, `teal`, `orange`

---

## Error Responses

All errors follow this format:

```json
{
  "status": 404,
  "message": "Không tìm thấy công việc",
  "error": "NOT_FOUND",
  "timestamp": "2026-03-15T10:00:00Z",
  "path": "/api/v1/tasks/123"
}
```

### Common Error Codes
- `400` - Bad Request: Invalid input data
- `401` - Unauthorized: Invalid or expired token
- `403` - Forbidden: Premium feature or limit exceeded
- `404` - Not Found: Resource doesn't exist
- `409` - Conflict: Duplicate resource
- `500` - Internal Server Error: System error
