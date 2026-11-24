# Đăng nhập Google và Facebook

Web dùng Google Identity Services và Facebook JavaScript SDK để nhận mã đăng nhập. Backend xác minh mã trực tiếp với Google/Meta, sau đó cấp access token và refresh token của thư viện. Không gửi App Secret đến trình duyệt.

## Cấu hình

1. Tạo OAuth Client ID loại **Web application** trong Google Cloud Console. Thêm origin của web, ví dụ `http://localhost:5173`, vào **Authorized JavaScript origins**. Gán Client ID vào `GOOGLE_WEB_CLIENT_ID`.
2. Tạo ứng dụng Meta có **Facebook Login** cho web. Thêm domain của web vào cấu hình ứng dụng và bật quyền `email`. Gán App ID vào `FACEBOOK_APP_ID` và App Secret vào `FACEBOOK_APP_SECRET`.
3. Điền các biến trên vào `.env` khi chạy Docker, hoặc vào biến môi trường của backend khi chạy trực tiếp. Với Docker, chạy lại `docker compose up -d --build backend web` sau khi cập nhật. Chỉ App ID và Google Client ID được trả cho giao diện; App Secret luôn ở backend.

Nếu chưa điền thông tin, nút tương ứng hiển thị trạng thái chưa cấu hình. Khi ứng dụng Meta chưa được phát hành, chỉ tài khoản có vai trò trong ứng dụng Meta đăng nhập được.

## Liên kết tài khoản đã có

- Google có thể tự liên kết email đã đăng ký khi Google là bên quản lý email đó (Gmail hoặc Google Workspace) và email đã xác thực.
- Facebook có cùng email với tài khoản đã đăng ký sẽ yêu cầu đăng nhập bằng mật khẩu trước, sau đó vào **Cài đặt tài khoản → Liên kết Google / Facebook**. Không dùng trùng email làm bằng chứng sở hữu tài khoản.
- Tài khoản mới từ mạng xã hội được tạo với quyền bạn đọc. Tài khoản bị khóa không đăng nhập được qua mạng xã hội. Chế độ bảo trì cũng chặn các endpoint đăng nhập này.

Luồng nút đăng nhập trong thay đổi này dành cho **web**. Mobile đang dùng Expo Go và cần luồng OAuth native cùng cấu hình ứng dụng Android/iOS riêng; không dùng App Secret của Meta trong mobile.
