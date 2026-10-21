# Frontend React — Thư Viện

Giao diện web cho hệ thống quản lý thư viện (React 18 + Vite + React Router + Axios).
Không dùng UI framework/Tailwind; toàn bộ style tự viết trong `src/index.css`.

## Chạy

```bash
# 1. Chạy backend Spring Boot trước (cổng 8080)
cd .. && mvn spring-boot:run

# 2. Chạy frontend (cổng 5173)
cd frontend
npm install
npm run dev
```

Mở http://localhost:5173 — đăng nhập admin: `admin@library.local` / `Admin@123`.
Vite proxy mọi request `/api/**` sang `http://localhost:8080` (xem `vite.config.js`), nên không bị lỗi CORS.

Mã xác thực đăng ký, đặt lại mật khẩu và đổi email đều gồm 6 chữ số, có hiệu lực 10 phút.
Màn hình quên mật khẩu và cài đặt tài khoản nhận mã rồi xác nhận trực tiếp trong giao diện. Khi để
`APP_MAIL_ENABLED=false`, nội dung email (bao gồm mã) được ghi trong log backend.

## Cấu trúc & mục đích từng file

| File | Chức năng | Dùng để làm gì |
|---|---|---|
| `src/main.jsx` | Khởi động | Mount React, bọc Router + AuthProvider |
| `src/App.jsx` | Định tuyến | Khai báo route công khai / cần đăng nhập / chỉ admin |
| `src/index.css` | Design system | Màu, font, layout, bảng sổ cái, con dấu hạn trả |
| `src/api/client.js` | Gọi API | Axios gắn JWT; gặp 401 thì tự gọi `/auth/refresh` rồi gửi lại request (khớp yêu cầu refresh token) |
| `src/api/auth.js` `books.js` `members.js` `borrow.js` `config.js` | Gọi API | Mỗi file ứng với 1 controller backend |
| `src/api/errors.js` | Xử lý lỗi | Đổi lỗi validate/503 bảo trì của backend thành câu thông báo |
| `src/context/AuthContext.jsx` | Phiên đăng nhập | Lưu user/role, login, logout (logout gọi API để backend chặn token) |
| `src/components/ProtectedRoute.jsx` | Phân quyền | Chặn route theo mã quyền (`permission="BOOK_VIEW"`...) lấy từ `can()` trong AuthContext |
| `src/components/Layout.jsx` | Khung trang | Sidebar + thanh trên; menu "Thành viên" chỉ hiện với thủ thư |
| `src/components/Modal.jsx` `Pagination.jsx` | Dùng chung | Hộp thoại (Esc để đóng), phân trang 10 dòng/trang |
| `src/components/DueStamp.jsx` | Điểm nhấn | Con dấu hạn trả (đỏ khi quá hạn), chỉ dùng ở màn Mượn/Trả |
| `src/pages/LoginPage.jsx` `RegisterPage.jsx` | Xác thực | Đăng nhập, đăng ký (hiện lỗi validate từng trường) |
| `src/pages/ForgotPasswordPage.jsx` | Quên mật khẩu | Gửi email đặt lại |
| `src/pages/EmailActionPage.jsx` | Link email cũ | Hướng dẫn yêu cầu mã mới; thao tác xác nhận dùng mã trên màn hình quên mật khẩu/cài đặt |
| `src/pages/DashboardPage.jsx` | Tổng quan | Admin: số sách/thành viên/trạng thái bảo trì. Thành viên: cuốn đang mượn |
| `src/pages/BooksPage.jsx` | Quản lý sách | Tìm theo tên/ISBN/tác giả/thể loại, phân trang; admin thêm/sửa/xoá, nhập CSV (kiểm tra .csv ≤ 5MB) |
| `src/pages/MembersPage.jsx` | Quản lý thành viên | Admin: tìm theo tên/email/sách đã mượn/khoảng ngày sinh (kiểm tra từ ≤ đến), tạo/sửa/xoá |
| `src/pages/CirculationPage.jsx` | Mượn/trả | Cuốn đang mượn + con dấu hạn trả, trả sách, mượn sách, lịch sử |
| `src/pages/PermissionsPage.jsx` | Phân quyền | Quản lý nhóm quyền (chọn quyền nhỏ), gán nhóm cho từng tài khoản |
| `src/api/permissions.js` | Gọi API | Nhóm quyền, quyền nhỏ, gán nhóm cho tài khoản |
| `src/pages/SettingsPage.jsx` | Cài đặt | Người có `CONFIG_VIEW/UPDATE`: bật/tắt bảo trì. Mọi người: đổi mật khẩu, đổi email |

## Lưu ý
- Menu và nút thao tác hiện theo mã quyền trong JWT response (`permissions`). Admin không có hồ sơ thành viên nên dù có quyền `BORROW_USE` vẫn không mượn sách được.
- Backend giới hạn 10 bản ghi/trang nên UI luôn gọi `size=10`.
