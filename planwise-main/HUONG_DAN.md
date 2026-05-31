# Kế Hoạch - Ứng dụng quản lý thời gian

## Tính năng chính

### 1. Quản lý danh mục tùy chỉnh
- Tạo, chỉnh sửa và xóa danh mục theo nhu cầu
- Mỗi danh mục có màu sắc riêng để dễ phân biệt
- Truy cập quản lý danh mục từ thanh bên (click vào nút + bên cạnh "Danh mục")

### 2. Quản lý sự kiện
- **Thêm sự kiện**: Click nút "Thêm sự kiện" ở Lịch tuần hoặc Lịch tháng
- **Chỉnh sửa sự kiện**: Click vào sự kiện bất kỳ để xem chi tiết và chỉnh sửa
- **Thông tin sự kiện**:
  - Tiêu đề
  - Ngày và giờ
  - Thời lượng
  - Danh mục
  - Địa điểm
  - Ghi chú

### 3. Quản lý công việc
- **Thêm công việc**: Click nút "Thêm công việc" ở trang Công việc
- **Chỉnh sửa công việc**: Click vào công việc để chỉnh sửa thông tin
- **Đánh dấu hoàn thành**: Click vào checkbox bên cạnh công việc
- **Mức độ ưu tiên**: Cao, Trung bình, Thấp
- **Lọc công việc**: Theo trạng thái (Tất cả, Đang làm, Hoàn thành) và mức độ ưu tiên

### 4. Các trang chính

#### Bảng điều khiển
- Tổng quan về sự kiện và công việc
- Lịch hôm nay
- Công việc sắp đến hạn
- Tiến độ theo danh mục

#### Lịch tuần
- Xem lịch theo tuần với khung giờ từ 7:00 - 21:00
- Click vào sự kiện để xem chi tiết hoặc chỉnh sửa
- Thanh đỏ hiển thị thời gian hiện tại

#### Lịch tháng
- Xem tổng quan lịch cả tháng
- Click vào ngày để xem chi tiết sự kiện
- Số lượng sự kiện hiển thị trên mỗi ngày

#### Công việc
- Danh sách tất cả công việc
- Tìm kiếm và lọc công việc
- Theo dõi tiến độ hoàn thành

## Hướng dẫn sử dụng

### Tạo danh mục mới
1. Mở thanh bên (sidebar)
2. Click vào nút + bên cạnh "Danh mục"
3. Click "Thêm danh mục mới"
4. Nhập tên và chọn màu
5. Click "Thêm"

### Tạo sự kiện mới
1. Vào trang "Lịch tuần" hoặc "Lịch tháng"
2. Click "Thêm sự kiện"
3. Điền thông tin: tiêu đề, ngày giờ, danh mục, địa điểm, ghi chú
4. Click "Thêm"

### Chỉnh sửa sự kiện
1. Click vào sự kiện cần chỉnh sửa
2. Modal chi tiết sẽ hiện ra
3. Chỉnh sửa thông tin
4. Click "Cập nhật" để lưu hoặc nút xóa để xóa sự kiện

### Tạo công việc mới
1. Vào trang "Công việc"
2. Click "Thêm công việc"
3. Điền thông tin: tiêu đề, danh mục, hạn chót, mức độ ưu tiên, mô tả
4. Click "Thêm"

### Chỉnh sửa công việc
1. Click vào công việc cần chỉnh sửa (không click vào checkbox)
2. Modal chỉnh sửa sẽ hiện ra
3. Cập nhật thông tin
4. Click "Cập nhật"

## Tính năng nổi bật

✅ Giao diện hoàn toàn bằng tiếng Việt
✅ Danh mục tùy chỉnh với nhiều màu sắc
✅ Click để chỉnh sửa sự kiện và công việc
✅ Tìm kiếm và lọc công việc
✅ Hiển thị tiến độ theo danh mục
✅ Giao diện hiện đại, dễ sử dụng
✅ Responsive design

## Công nghệ sử dụng

- React + TypeScript
- React Router (routing)
- Context API (quản lý state)
- Tailwind CSS v4 (styling)
- Lucide React (icons)
