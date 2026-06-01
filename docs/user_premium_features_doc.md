# Tài liệu Phân Quyền Thành Viên: FREE vs PREMIUM – PlanWise

Tài liệu này chi tiết hóa sự khác biệt về tính năng, quyền hạn truy cập, cơ chế kiểm soát giới hạn (Limits Guard) giữa tài khoản thường (FREE) và tài khoản hội viên (PREMIUM) trong ứng dụng PlanWise.

---

## 1. Bảng So Sánh Quyền Lợi Sử Dụng

| Tính Năng | Tài Khoản Thường (FREE) | Tài Khoản Hội Viên (PREMIUM) |
| :--- | :--- | :--- |
| **Giới hạn Mục tiêu (Goals)** | Tối đa **3** mục tiêu (Tổng số mục tiêu tuần, tháng, năm) | **Không giới hạn** (Unlimited) |
| **Giới hạn Thói quen (Habits)** | Tối đa **3** thói quen | **Không giới hạn** (Unlimited) |
| **Giao diện Phân tích (Analytics)** | **Bị khóa** (Làm mờ bằng bộ lọc blur & hiển thị panel yêu cầu nâng cấp) | **Mở khóa 100%** (Biểu đồ tiến độ tuần, biến động năng lượng, phân bổ thời gian, chuỗi thói quen) |
| **Gợi ý thông minh (AI Recap)** | Bị ẩn / làm mờ | **Mở khóa** gợi ý tối ưu lịch trình chi tiết hàng tuần/tháng từ AI Mentor |
| **Trợ lý ảo AI Chatbot Coach** | Bị giới hạn số lượt chat và ngữ cảnh | **Trò chuyện không giới hạn** với AI Coach |
| **Danh mục Cá nhân hóa** | Chỉ sử dụng 6 danh mục mặc định | **Tự do tạo danh mục mới** với bộ màu sắc tùy biến tùy chọn |
| **Huy hiệu VIP** | Không có | Có huy hiệu **PRO** màu vàng kim nổi bật ở Sidebar |

---

## 2. Chi Tiết Kỹ Thuật & Cách Thức Impl (Implementation Details)

Hệ thống phân quyền được đồng bộ hóa từ Cơ sở dữ liệu, đi qua API Backend và được kiểm soát trực tiếp ở Frontend.

### A. Nhận biết trạng thái Premium từ Auth State
Thông tin phân quyền được đính kèm trực tiếp trong DTO `UserInfo` của người dùng từ API đăng nhập hoặc lấy thông tin cá nhân (`/api/v1/auth/me`).
Frontend đọc thông tin này từ [AuthContext.tsx](file:///d:/learning/EXE201/EXE201_PlanWise/fe/src/app/context/AuthContext.tsx) thông qua hook `useAuth()`:

```typescript
const { user } = useAuth();
const isPremium = user?.isPremium; // boolean (true/false)
const premiumExpiresAt = user?.premiumExpiresAt; // ISO String hoặc null
```

---

### B. Cơ chế chặn giới hạn Mục tiêu (Goals Limits Guard)
Trong file [GoalsView.tsx](file:///d:/learning/EXE201/EXE201_PlanWise/fe/src/app/components/GoalsView.tsx), khi người dùng cố gắng thêm một mục tiêu mới (Tuần, Tháng hoặc Năm):

1. **Kiểm tra số lượng hiện tại:**
   ```typescript
   const totalGoals = weeklyGoals.length + monthlyGoals.length + yearlyGoals.length;
   ```
2. **Nếu chưa nâng cấp VIP và đạt giới hạn 3 mục tiêu:**
   Chặn hành động thêm mới và kích hoạt hiển thị Modal nâng cấp Premium.
   ```typescript
   if (!user?.isPremium && totalGoals >= 3) {
       setShowUpgradeModal(true);
       return;
   }
   ```
3. **Nút "Thêm mục tiêu" ở Header:**
   Cũng được đính kèm kiểm tra tương tự để tránh việc người dùng nhập dữ liệu rồi mới bị báo lỗi, tối ưu trải nghiệm người dùng (UX).

---

### C. Cơ chế chặn giới hạn Thói quen (Habits Limits Guard)
Trong file [HabitsView.tsx](file:///d:/learning/EXE201/EXE201_PlanWise/fe/src/app/components/HabitsView.tsx):

1. **Nút "Thêm thói quen" ở góc phải:**
   Chỉ cho phép mở Form tạo thói quen nếu người dùng là Premium hoặc số lượng thói quen hiện tại dưới 3:
   ```typescript
   onClick={() => {
       if (!user?.isPremium && habits.length >= 3) {
           setShowUpgradeModal(true);
           return;
       }
       setShowAddModal(true);
   }}
   ```
2. **Tính năng bổ sung cho Premium:**
   Form tạo thói quen mới (`renderAddModal`) cho phép tùy chọn tên thói quen, mô tả ngắn, tần suất (hàng ngày, tuần, tháng) và bộ 8 màu sắc chủ đề cá nhân hóa (`indigo`, `blue`, `emerald`, `amber`, `rose`, `purple`, `teal`, `orange`).

---

### D. Cơ chế làm mờ Báo cáo Phân tích (Analytics Blur Lock)
Trong file [AnalyticsView.tsx](file:///d:/learning/EXE201/EXE201_PlanWise/fe/src/app/components/AnalyticsView.tsx):

Thay vì ẩn hoàn toàn trang hoặc chặn truy cập (gây cảm giác hụt hẫng cho người dùng), hệ thống sử dụng phương án **"Teasing" (Kích thích thị giác)**:
1. **Lớp phủ làm mờ nội dung:**
   Nếu `!user?.isPremium`, toàn bộ lưới biểu đồ Recharts và khung AI Recap sẽ bị thêm các class Tailwind:
   ```css
   blur-md pointer-events-none select-none
   ```
   Hiệu ứng này làm mờ các biểu đồ nhưng vẫn để người dùng nhìn thấy thấp thoáng hình ảnh của các biểu đồ xu hướng chuyên nghiệp phía sau.
2. **Hộp thoại Khóa ở trung tâm:**
   Một tấm card tuyệt đẹp với thiết kế dark theme phát sáng màu chàm/tím nằm đè lên lớp làm mờ, giải thích rõ các quyền lợi phân tích chuyên sâu nhận được khi lên VIP và nút CTA **"Nâng cấp Premium để Mở Khóa"** đưa trực tiếp tới trang bảng giá.
