# AI Goal Planner - Tóm Tắt Các File Mới/Thay Đổi

**Cập nhật lần cuối**: 2026-06-29

## 📋 Tổng Quan

Tài liệu này tóm tắt tất cả các file mới được tạo và các thay đổi cho tính năng **AI Goal Planner** trong phần backend (`be/`).

AI Goal Planner là một tính năng hỗ trợ người dùng tự động chuyển đổi một mục tiêu cấp cao thành một lộ trình thực hiện hoàn chỉnh bằng cách sử dụng AI.

---

## 📁 Cấu Trúc Thư Mục

```
be/
├── src/main/java/com/exe201/planwise/
│   └── ai/                                    # Module AI chính
│       ├── controller/
│       │   └── GoalAIController.java
│       ├── service/
│       │   ├── GoalAIService.java            # Interface
│       │   └── GoalAIServiceImpl.java         # Thực hiện
│       ├── provider/
│       │   ├── AIProvider.java               # Interface provider
│       │   └── OllamaProvider.java           # Thực hiện Ollama
│       ├── dto/
│       │   ├── GenerateGoalDraftRequest.java
│       │   ├── CreateGoalFromDraftRequest.java
│       │   ├── GoalDraftResponse.java
│       │   ├── GoalRoadmapDraft.java
│       │   ├── GoalMilestoneDraft.java
│       │   └── GoalTaskDraft.java
│       ├── entity/
│       │   ├── GoalDraft.java
│       │   └── GoalDraftStatus.java
│       ├── repository/
│       │   └── GoalDraftRepository.java
│       ├── parser/
│       │   └── GoalDraftParser.java
│       ├── validator/
│       │   └── GoalDraftValidator.java
│       ├── prompt/
│       │   └── PromptLoader.java
│       └── exception/
│           └── AIException.java
│       
│
├── src/main/resources/
│   └── prompts/
│       ├── goal-planner.txt                  # Prompt cho AI goal planner
│       ├── daily-planner.txt                 # Prompt cho daily planner (tương lai)
│       └── weekly-review.txt                 # Prompt cho weekly review (tương lai)
```

---

## 📄 Chi Tiết Các File

### 1. **Controller Layer**

#### `GoalAIController.java`
- **Mục đích**: API endpoint cho tính năng AI Goal Planner
- **Endpoint chính**:
  - `POST /api/ai/goals/generate` - Tạo draft roadmap từ goal
  - `POST /api/goals/create-from-draft` - Tạo goal từ draft
  - `GET /api/ai/goals/draft/{id}` - Lấy draft theo ID
  - `POST /api/ai/goals/regenerate/{id}` - Tạo lại draft

---

### 2. **Service Layer**

#### `GoalAIService.java` (Interface)
- **Mục đích**: Định nghĩa contract cho AI service
- **Phương thức chính**:
  - `generateGoalDraft()` - Tạo draft roadmap
  - `createGoalFromDraft()` - Tạo goal từ draft
  - `regenerateDraft()` - Tạo lại draft

#### `GoalAIServiceImpl.java`
- **Mục đích**: Thực hiện logic cho AI goal planner
- **Chức năng**:
  - Gọi AIProvider để tạo roadmap
  - Validate kết quả từ AI
  - Lưu draft vào database
  - Tạo Goal, Milestone, Task trong transaction
  - Xử lý lỗi và ngoại lệ

---

### 3. **Provider Layer**

#### `AIProvider.java` (Interface)
- **Mục đích**: Abstract interface cho các LLM providers khác nhau
- **Phương thức**:
  - `chat()` - Chat đơn giản
  - `generateGoalRoadmap()` - Tạo roadmap cho goal
  - `generateDailyPlan()` - Tạo daily plan (tương lai)
  - `weeklyReview()` - Tạo weekly review (tương lai)
- **Lợi ích**: Cho phép thay đổi LLM provider mà không ảnh hưởng đến business logic

#### `OllamaProvider.java`
- **Mục đích**: Thực hiện AIProvider cho Ollama LLM
- **Chức năng**:
  - Gọi Ollama API
  - Gửi prompt và context
  - Nhận JSON response từ AI

---

### 4. **Data Transfer Object (DTO)**

#### `GenerateGoalDraftRequest.java`
- **Dữ liệu từ client**:
  - Goal title, description
  - Category, deadline
  - Period, target date
  - Priority, constraints
  - Timeline, available hours per week

#### `CreateGoalFromDraftRequest.java`
- **Dữ liệu từ client**:
  - Draft ID
  - Danh sách milestone và task (có thể được edit)

#### `GoalDraftResponse.java`
- **Phản hồi về draft**:
  - Draft ID, status
  - Created at, updated at
  - Goal summary
  - Roadmap data (milestones, tasks)

#### `GoalRoadmapDraft.java`
- **Cấu trúc roadmap**:
  - Goal summary
  - Danh sách milestones
  - Estimated total hours
  - Timeline overview

#### `GoalMilestoneDraft.java`
- **Thông tin milestone**:
  - Title, description
  - Estimated deadline
  - Priority, deliverables
  - Danh sách tasks

#### `GoalTaskDraft.java`
- **Thông tin task**:
  - Title, description
  - Estimated hours, priority
  - Suggested deadline
  - Dependencies

---

### 5. **Entity Layer**

#### `GoalDraft.java`
- **Bảng database**: `ai_goal_drafts`
- **Cột chính**:
  - `id` (UUID) - Khóa chính
  - `user_id` (UUID) - Liên kết user
  - `generated_json` (JSON) - Roadmap dạng JSON
  - `status` (ENUM) - Trạng thái draft
  - `created_at` (Timestamp) - Thời gian tạo
  - `updated_at` (Timestamp) - Thời gian cập nhật

#### `GoalDraftStatus.java` (ENUM)
- **Các trạng thái**:
  - `CREATED` - Vừa tạo
  - `APPROVED` - Đã được phê duyệt
  - `REJECTED` - Bị từ chối
  - `EXPIRED` - Hết hạn
- **Ghi chú**: Chỉ draft `APPROVED` mới có thể chuyển thành Goal

---

### 6. **Repository Layer**

#### `GoalDraftRepository.java`
- **Mục đích**: Database access cho GoalDraft
- **Phương thức**:
  - `findByUserId()` - Lấy draft theo user
  - `findByStatus()` - Lấy draft theo status
  - `findLatestByUserId()` - Lấy draft mới nhất của user
  - Standard CRUD operations

---

### 7. **Parser Layer**

#### `GoalDraftParser.java`
- **Mục đích**: Parse JSON response từ AI thành DTO
- **Chức năng**:
  - Chuyển JSON thành GoalRoadmapDraft
  - Xử lý các trường không bắt buộc
  - Error handling nếu JSON không hợp lệ
  - Type casting và validation

---

### 8. **Validator Layer**

#### `GoalDraftValidator.java`
- **Mục đích**: Validate draft trước khi lưu
- **Kiểm tra**:
  - Milestone không trống
  - Task không trống
  - Deadline hợp lệ (nằm trong goal deadline)
  - Priority hợp lệ
  - Estimated hours hợp lệ (> 0)
  - Milestones có deliverables
  - Task dependencies hợp lệ

---

### 9. **Prompt Layer**

#### `PromptLoader.java`
- **Mục đích**: Load prompt từ file thay vì hardcode
- **Tính năng**:
  - Load prompt từ `resources/prompts/`
  - Inject dynamic variables (goal title, deadline, etc.)
  - Cache prompt nếu cần
  - Support multiple prompt files

---

### 10. **Exception Layer**

#### `AIException.java`
- **Mục đích**: Custom exception cho AI module
- **Các loại lỗi**:
  - `AI_SERVICE_UNAVAILABLE` - LLM không khả dụng
  - `INVALID_PROMPT` - Prompt không hợp lệ
  - `PARSE_ERROR` - Lỗi parse JSON
  - `VALIDATION_ERROR` - Draft không pass validation
  - `DRAFT_NOT_FOUND` - Draft không tồn tại

---

### 11. **Prompt Files**

#### `goal-planner.txt`
- **Mục đích**: System prompt cho AI khi tạo goal roadmap
- **Nội dung**:
  - System instruction cho AI
  - JSON schema để trả về structured data
  - Planning rules (cách chia milestone, task)
  - Deadline rules (cách tính deadline)
  - Priority rules (cách assign priority)
  - Variables: `{goalTitle}`, `{goalDeadline}`, `{availableHoursPerWeek}`, etc.

#### `daily-planner.txt`
- **Mục đích**: System prompt cho daily planner (tính năng tương lai)
- **Trạng thái**: Đã tạo, chưa sử dụng

#### `weekly-review.txt`
- **Mục đích**: System prompt cho weekly review (tính năng tương lai)
- **Trạng thái**: Đã tạo, chưa sử dụng

---

## 🔄 Workflow Chính

```
1. User gửi goal information
    ↓
2. GoalAIController nhận request
    ↓
3. GoalAIServiceImpl xử lý:
   - Load prompt từ PromptLoader
   - Inject user context vào prompt
   - Gọi AIProvider (ví dụ: OllamaProvider)
    ↓
4. AIProvider:
   - Gửi prompt + context tới LLM
   - Nhận JSON response
    ↓
5. GoalAIServiceImpl:
   - Parse JSON bằng GoalDraftParser
   - Validate bằng GoalDraftValidator
   - Lưu GoalDraft vào database
   - Trả về GoalDraftResponse
    ↓
6. Frontend hiển thị draft cho user edit
    ↓
7. User phê duyệt hoặc edit draft
    ↓
8. GoalAIController nhận CreateGoalFromDraftRequest
    ↓
9. GoalAIServiceImpl:
   - BEGIN TRANSACTION
   - Tạo Goal record
   - Tạo Milestone records
   - Tạo Task records
   - COMMIT
   - Update draft status = APPROVED
    ↓
10. Return success/error
```

---

## 🎯 Các Tính Năng Chính

### 1. **Generate Goal Draft**
- Nhận input từ user
- Gửi tới AI để tạo roadmap
- Trả về draft cho user review
- Draft không được save vào Goal ngay

### 2. **Review & Edit Draft**
- User có thể edit milestone, task
- Add/remove milestone, task
- Change deadline, priority
- Frontend hỗ trợ UI cho editing

### 3. **Create Goal from Draft**
- User phê duyệt draft
- System tạo Goal, Milestone, Task trong 1 transaction
- Rollback nếu có lỗi
- Update draft status = APPROVED

### 4. **Regenerate Draft**
- User có thể tạo lại draft
- Draft cũ trở thành EXPIRED
- Draft mới thay thế (status = CREATED)

---

## 🔌 Cách Extend cho AI Features Khác

Kiến trúc được thiết kế để dễ dàng mở rộng:

### Để thêm Daily Planner:

1. Tạo `DailyPlannerAIService` (reuse `GoalAIServiceImpl`)
2. Tạo `DailyPlannerRequest`, `DailyPlannerResponse` DTO
3. Tạo `DailyPlannerController`
4. Thêm `generateDailyPlan()` vào `AIProvider`
5. Sử dụng lại: `PromptLoader`, `Parser`, `Validator`

### Lợi ích:
- Không cần modify `GoalAIService`
- Reuse `AIProvider` interface
- Reuse `PromptLoader`, `Validator`, `Parser`
- Nhất quán kiến trúc

---

## 📊 Thay Đổi Database Schema

### Migration File: `V4__create_ai_goal_drafts.sql`

File migration này tạo infrastructure cần thiết cho AI Goal Planner feature:

#### 1. **ENUM Type: `ai_goal_draft_status`**

```sql
CREATE TYPE ai_goal_draft_status AS ENUM ('CREATED', 'APPROVED', 'REJECTED', 'EXPIRED');
```

- **Mục đích**: Định nghĩa trạng thái của draft
- **Các giá trị**:
  - `CREATED` - Draft vừa tạo bởi AI, chưa được phê duyệt
  - `APPROVED` - User đã phê duyệt draft, đã tạo Goal/Milestone/Task
  - `REJECTED` - User từ chối draft
  - `EXPIRED` - Draft hết hạn (được regenerate)
- **Lợi ích**: Type-safe, performance tốt hơn VARCHAR

#### 2. **Table: `ai_goal_drafts`**

```sql
CREATE TABLE IF NOT EXISTS ai_goal_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    generated_json JSONB NOT NULL,
    status ai_goal_draft_status NOT NULL DEFAULT 'CREATED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Cột chi tiết**:

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | UUID | Khóa chính, tự động generate |
| `user_id` | UUID FK | Liên kết tới `users(id)`, CASCADE delete |
| `generated_json` | JSONB | Roadmap từ AI (milestones, tasks) |
| `status` | ai_goal_draft_status | Trạng thái draft (default: CREATED) |
| `created_at` | TIMESTAMPTZ | Thời gian tạo (default: NOW) |

**Đặc điểm**:
- `JSONB` cho phép query, index trên JSON fields
- `CASCADE DELETE` khi user bị xóa
- `DEFAULT CURRENT_TIMESTAMP` tự động capture thời gian tạo
- Không có cột `updated_at` (draft thường không được update, chỉ regenerate)

#### 3. **Index: `idx_ai_goal_drafts_user_status`**

```sql
CREATE INDEX IF NOT EXISTS idx_ai_goal_drafts_user_status ON ai_goal_drafts(user_id, status);
```

- **Mục đích**: Optimize queries tìm draft theo user + status
- **Sử dụng trong**:
  - Lấy draft mới nhất của user: `WHERE user_id = ? AND status = 'CREATED'`
  - Lấy tất cả draft của user: `WHERE user_id = ?`
  - Lấy approved drafts: `WHERE user_id = ? AND status = 'APPROVED'`

### Thay Đổi trong `schema.sql`

File `schema.sql` được updated để include ENUM type và table definitions:

```sql
CREATE TYPE ai_goal_draft_status AS ENUM ('CREATED', 'APPROVED', 'REJECTED', 'EXPIRED');

CREATE TABLE IF NOT EXISTS ai_goal_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    generated_json JSONB NOT NULL,
    status ai_goal_draft_status NOT NULL DEFAULT 'CREATED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_goal_drafts_user_status ON ai_goal_drafts(user_id, status);
```

### Liên Kết với Các Bảng Khác

```
users (1)
  │
  └─────> (N) ai_goal_drafts
             │
             └─────> (1) goals (created from draft)
                       │
                       ├─────> (N) milestones
                       │
                       └─────> (N) tasks
```

**Flow**:
1. User tạo draft → lưu vào `ai_goal_drafts` (status = CREATED)
2. User phê duyệt → tạo records trong `goals`, `milestones`, `tasks`
3. Update draft status = APPROVED
4. Draft cũ có thể regenerate → status = EXPIRED


### JSON Structure trong `generated_json`

Ví dụ cấu trúc lưu trong JSONB:

```json
{
  "goalSummary": "Hoàn thành dự án X",
  "estimatedTotalHours": 120,
  "milestones": [
    {
      "id": "uuid",
      "title": "Phase 1",
      "description": "Planning",
      "deadline": "2026-07-15",
      "priority": "HIGH",
      "deliverables": ["Document", "Roadmap"],
      "tasks": [
        {
          "id": "uuid",
          "title": "Collect Requirements",
          "estimatedHours": 16,
          "priority": "HIGH",
          "deadline": "2026-07-10"
        }
      ]
    }
  ]
}
```
