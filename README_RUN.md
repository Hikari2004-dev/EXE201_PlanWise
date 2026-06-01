# Hướng dẫn chạy dự án PlanWise (Cả FE và BE)

Tài liệu này hướng dẫn bạn cách thiết lập môi trường và khởi chạy đồng thời Backend (Spring Boot) và Frontend (Vite + React) của PlanWise.

---

## 1. Hướng dẫn chạy Backend (Spring Boot)

### Yêu cầu:
- Đã cài đặt **Java 21**.
- Đã cài đặt **Maven**.

### Các bước thực hiện:
Tôi đã tạo sẵn file [run-be.ps1](file:///d:/learning/EXE201/EXE201_PlanWise/be/run-be.ps1) trong thư mục `be/`. Script này sẽ tự động đọc file `.env`, nạp các biến cấu hình kết nối Database, JWT, OAuth2 vào môi trường chạy và khởi động server.

1. Mở terminal **PowerShell** tại thư mục `be/`:
   ```powershell
   cd be
   ```
2. Chạy file script:
   ```powershell
   .\run-be.ps1
   ```

*Lưu ý: Nếu Windows báo lỗi Policy không cho chạy script, bạn có thể chạy lệnh sau trước rồi chạy lại:*
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

*(Hoặc cách chạy thủ công nếu không dùng script: Mở terminal, chạy các lệnh gán biến môi trường `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` và gõ `mvn spring-boot:run`)*

Backend sẽ chạy thành công tại địa chỉ: `http://localhost:8080`

---

## 2. Hướng dẫn chạy Frontend (Vite + React)

### Yêu cầu:
- Đã cài đặt **Node.js** (khuyến nghị phiên bản 18 hoặc 20 trở lên).

### Các bước thực hiện:

1. Mở terminal tại thư mục `fe/`:
   ```bash
   cd fe
   ```
2. Cài đặt các thư viện cần thiết (nếu chưa cài):
   ```bash
   npm install
   ```
3. Chạy Frontend ở chế độ Developer:
   ```bash
   npm run dev
   ```

Frontend sẽ khởi chạy thành công tại địa chỉ: `http://localhost:5173`

---

## 3. Kiểm tra Luồng Đăng nhập & Xác thực
1. Truy cập trang web: `http://localhost:5173/`
2. Hệ thống sẽ tự động chặn và chuyển hướng bạn đến `/login`.
3. Bạn có thể tiến hành:
   - **Đăng ký tài khoản mới**: Click *Đăng ký ngay*, điền thông tin và đăng ký.
   - **Đăng nhập bằng Email/Password**: Điền tài khoản đã đăng ký để đăng nhập.
   - **Đăng nhập bằng Google**: Nhấn nút *Google*. Hệ thống sẽ chuyển hướng qua trang đăng nhập của Google, sau khi hoàn thành sẽ quay lại ứng dụng và đồng bộ tài khoản thành công.
