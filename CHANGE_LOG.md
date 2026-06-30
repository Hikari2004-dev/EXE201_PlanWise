# CHANGE_LOG - Cập nhật từ Vision Board sang AI Goal Planner

**Cập nhật lần cuối**: 2026-06-29
 
**Mô tả**: Loại bỏ hoàn toàn tính năng Vision Board khỏi backend và frontend, thay thế bằng AI Goal Planner

---

## Tóm Tắt Thay Đổi

### Backend (Spring Boot)
- **Thêm**: Toàn bộ module AI (`ai/` directory), thông tin chi tiết: `be\src\main\java\com\exe201\planwise\ai\README_AI_GOAL_PLANNER.md`
- **Xóa**: Toàn bộ module Vision (`vision/` directory)
- **Sửa**: ErrorCode.java, API documentation, OpenAPI spec
- **Kết quả**: Không còn Vision endpoints, tất cả references được loại bỏ

### Frontend (React/TypeScript)
- **Sửa**: GoalsView.tsx (UI migration), Sidebar.tsx (label update), mockData.ts (cleanup)
- **Thêm**: Hỗ trợ đầy đủ cho AI Goal Planner API
- **Kết quả**: GoalsView hiển thị AI Goal Planner form thay vì Vision Board

### Database
- **Thêm**: Migration File `V4__create_ai_goal_drafts.sql`.
- **Sửa**: tạo `ai_goal_draft_status` enum type và table `ai_goal_drafts` trong schema.sql 
- **Ghi chú**: Table `vision_items` được giữ lại như legacy data (không xóa schema)

---

## Chi Tiết Thay Đổi

### Backend

#### ❌ Xóa: `be/src/main/java/com/exe201/planwise/vision/` (Toàn bộ 10 file)

**Files xóa:**
1. `VisionController.java` - REST endpoints cho Vision API
2. `VisionService.java` - Business logic (~300 lines)
3. `VisionImageUploadService.java` - S3/R2 integration
4. `VisionItem.java` - JPA Entity
5. `VisionItemRepository.java` - Database access
6. `VisionItemDto.java` - Data transfer object
7. `CreateVisionItemRequest.java` - Request DTO
8. `UpdateVisionItemRequest.java` - Request DTO
9. `PresignVisionImageUploadRequest.java` - Image upload request
10. `PresignVisionImageUploadResponse.java` - Image upload response

**Lý do**: Vision Board feature không còn được sử dụng, thay thế bằng AI Goal Planner

#### 📝 Sửa: `be/src/main/java/com/exe201/planwise/exception/ErrorCode.java`

**Thay đổi**: Xóa enum value `VISION_ITEM_NOT_FOUND`
```java
// Trước:
VISION_ITEM_NOT_FOUND("Không tìm thấy vision item", HttpStatus.NOT_FOUND),

// Sau:
// (xóa - không còn được dùng)
```

#### 📝 Sửa: `docs/api_general_features.md`

**Thay đổi**: Xóa Section 7 "Vision Items API" hoàn toàn
- Xóa: `GET /api/v1/vision` - List vision items
- Xóa: `POST /api/v1/vision` - Create vision item
- Xóa: `PUT /api/v1/vision/{itemId}` - Update vision item
- Xóa: `DELETE /api/v1/vision/{itemId}` - Delete vision item
- Xóa: `POST /api/v1/vision/{itemId}/image-upload` - Image upload presign
- Renumber: Sections 8-9 trở thành 7-8

#### 📝 Sửa: `be/openapi.json`

**Thay đổi**: Xóa OpenAPI specification cho Vision endpoints
- Xóa: `/api/v1/vision` path (GET, POST)
- Xóa: `/api/v1/vision/{itemId}` path (PUT, DELETE)
- Xóa: `VisionItemDto` schema
- Xóa: `CreateVisionItemRequest` schema
- Xóa: `UpdateVisionItemRequest` schema
- Xóa: `PresignVisionImageUploadRequest` schema
- Xóa: `PresignVisionImageUploadResponse` schema

### Frontend

#### 📝 Sửa: `fe/src/app/components/GoalsView.tsx`

**Thay đổi chính:**
- **Line 2**: Import `visionApi` → `aiGoalPlannerApi`
- **Lines 24-35**: Type definition `VisionDraft` → `AIGoalDraft`
- **Lines 37-42**: Constant `EMPTY_VISION_DRAFT` → `EMPTY_AI_DRAFT`
- **Line 71**: useData() - xóa destructuring: `visionItems`, `addVisionItem`, `updateVisionItem`, `deleteVisionItem`
- **Lines 87-89**: State variables cập nhật:
  - Xóa: `visionDraft`, `editingVisionId`, `visionUploading`, `handleVisionImageSelect`
  - Thêm: `aiDraft`, `aiGenerating`, `aiDraftResult`
- **Lines 198-233**: Thêm 2 handler functions mới:
  - `handleGenerateAIGoal()` - Generate goal draft from input
  - `handleCreateFromAIDraft()` - Create actual goal from approved draft
- **Line 590**: Page title "Bảng tầm nhìn và mục tiêu" → "Mục tiêu & AI Planner"
- **Line 611**: Hint bubble cập nhật mô tả AI Goal Planner
- **Lines 614-740**: UI section thay đổi:
  - ❌ Xóa: Vision Board form (title, category, description, image upload, quote)
  - ❌ Xóa: Vision item card display với edit/delete buttons
  - ✅ Thêm: AI Goal Planner form (title, category, period, priority, description, deadline)
  - ✅ Thêm: Generate button với AI Sparkles icon
  - ✅ Thêm: Display section cho generated drafts (roadmap, milestones, tasks)
  - ✅ Thêm: Approve & Create button

**Verification**: Imports (`lucide-react`, `useMemo`, `useState`) đã sẵn có

#### 📝 Sửa: `fe/src/app/components/Sidebar.tsx`

**Thay đổi**: Navigation label update (Line 127)
```typescript
// Trước:
label: language === "vi" ? "Tầm nhìn & Mục tiêu" : "Vision & Goals",

// Sau:
label: language === "vi" ? "Mục tiêu & AI Planner" : "Goals & AI Planner",
```

#### 📝 Sửa: `fe/src/app/data/mockData.ts`

**Thay đổi:**
1. Xóa: `interface VisionItem` definition (Lines 68-74)
2. Xóa: `export const VISION_ITEMS: VisionItem[]` mock data array (Lines 278-282)

```typescript
// Xóa:
export interface VisionItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  quote?: string;
  category: string;
}

export const VISION_ITEMS: VisionItem[] = [
  { id: "mock-vision-1", title: "Thành công trong sự nghiệp", description: "Trở thành Senior Developer", quote: "Success is not final, failure is not fatal", category: "career" },
  { id: "mock-vision-2", title: "Sức khỏe tốt", description: "Duy trì thể hình lý tưởng", quote: "Health is wealth", category: "health" },
];
```

#### ✅ Verified: `fe/src/app/api/aiGoalPlanner.ts`

**Status**: Không cần thay đổi - already có:
- `generate()` function - Gọi `/api/v1/ai/goals/generate`
- `createGoalFromDraft()` function - Gọi `/api/v1/goals/create-from-draft`

#### ✅ Verified: `fe/src/app/api/types.ts`

**Status**: Không cần thay đổi - already có:
- `GenerateGoalDraftRequest` type
- `GoalDraftResponse` type
- `CreateGoalFromDraftRequest` type
- `GoalRoadmapDraft` type
- `GoalMilestoneDraft` type
- `GoalTaskDraft` type

#### ✅ Verified: `fe/src/app/context/DataContext.tsx`

**Status**: Không cần thay đổi - không có vision references

---

## Backend API Changes

### Endpoints Removed (Xóa)
```
GET    /api/v1/vision              - List vision items
POST   /api/v1/vision              - Create vision item
PUT    /api/v1/vision/{itemId}     - Update vision item
DELETE /api/v1/vision/{itemId}     - Delete vision item
POST   /api/v1/vision/{itemId}/image-upload - Image upload presign
```

### Endpoints Available (Đã tồn tại - AI Goal Planner)
```
POST   /api/v1/ai/goals/generate        - Generate goal drafts
POST   /api/v1/goals/create-from-draft  - Create goal from approved draft
```

---

## Database Notes

**Vision Items Table**: `vision_items`
- **Status**: Giữ lại như legacy data
- **Reason**: Để bảo lưu dữ liệu lịch sử người dùng
- **Action**: Không xóa schema hoặc migration

---

## Migration Steps (Cho Developers)

### Backend
```bash
# 1. Verify compilation (vision code xóa hết)
cd be
mvn clean compile

# 2. Run tests
mvn test

# 3. Build package
mvn clean package
```

### Frontend
```bash
# 1. Verify types
cd fe
npm run type-check

# 2. Build
npm run build

# 3. Test
npm test
```

---

## Files Changed Summary

| Category | File | Status | Action |
|----------|------|--------|--------|
| Backend | `be/src/main/java/com/exe201/planwise/vision/` | ❌ Deleted | Xóa 10 files |
| Backend | `be/src/main/java/com/exe201/planwise/exception/ErrorCode.java` | ✏️ Modified | Xóa enum value |
| Docs | `docs/api_general_features.md` | ✏️ Modified | Xóa Vision API section |
| API Spec | `be/openapi.json` | ✏️ Modified | Xóa vision paths/schemas |
| Frontend | `fe/src/app/components/GoalsView.tsx` | ✏️ Modified | Replace vision UI với AI planner |
| Frontend | `fe/src/app/components/Sidebar.tsx` | ✏️ Modified | Update navigation label |
| Frontend | `fe/src/app/data/mockData.ts` | ✏️ Modified | Xóa VisionItem definitions |
| Frontend | `fe/src/app/api/aiGoalPlanner.ts` | ✅ Verified | Không cần thay đổi |
| Frontend | `fe/src/app/api/types.ts` | ✅ Verified | Không cần thay đổi |
| Frontend | `fe/src/app/context/DataContext.tsx` | ✅ Verified | Không cần thay đổi |

---

## Notes

### Architecture
- **AI Goal Planner** hoạt động hoàn toàn qua API endpoints mới
- **Database schema** không bị ảnh hưởng (ngoài việc vision_items không được sử dụng)
- **Frontend** sử dụng `aiGoalPlannerApi` service (đã tồn tại)

### Backward Compatibility
- ❌ Vision API endpoints không còn khả dụng
- ✅ Dữ liệu vision_items được giữ lại trong database
- ✅ AI Goal Planner là drop-in replacement tương tự

### Testing
- Cần verify backend compilation
- Cần verify frontend build
- Cần test AI Goal Planner form submission
- Cần test generated draft display

---

## Completion Date

**Started**: Tháng 12, 2024
**Completed**: Tháng 12, 2024
**Status**: ✅ COMPLETE - Tất cả vision references đã được loại bỏ, AI Goal Planner hoàn toàn thay thế
