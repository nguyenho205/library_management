# ỨNG DỤNG DI ĐỘNG THƯ VIỆN SỐ (REACT NATIVE & EXPO)

Ứng dụng di động dành cho bạn đọc thư viện được xây dựng bằng **React Native (Expo)**, tích hợp hoàn toàn với hệ thống backend **Spring Boot API** hiện có.

---

## 📱 Các tính năng chính trên Mobile

1. **Xác thực & Tài khoản:**
   - Đăng nhập, đăng ký thẻ bạn đọc mới, đổi mật khẩu.
   - Hiển thị thẻ bạn đọc điện tử ảo với mã số thẻ và thời hạn mượn.
   - Cài đặt tùy chỉnh địa chỉ IP máy chủ API linh hoạt ngay trên ứng dụng.

2. **Khám phá & Tra cứu sách:**
   - Trang chủ hiển thị sách được quan tâm, sách mới cập nhật, tóm tắt trạng thái mượn và cảnh báo quá hạn.
   - Tìm kiếm sách thời gian thực theo tên, tác giả, mã ISBN.
   - Lọc danh mục theo thể loại dạng thẻ cuộn ngang.
   - Xem chi tiết tác phẩm: bìa lớn, số lượng tồn kho khả dụng, tóm tắt nội dung, vị trí kệ.

3. **Mượn & Quản lý lưu thông:**
   - Gửi yêu cầu mượn sách trực tiếp trên app với thời hạn quy định (10 ngày / tối đa 2 cuốn).
   - Theo dõi chi tiết các sách đang mượn, ngày đến hạn hoàn trả, số ngày quá hạn và tiền phạt phát sinh.
   - Nút **"Trả sách tại quầy"** hiển thị popup hướng dẫn trực quan 4 bước hoàn trả sách tại quầy thủ thư.
   - Huỷ yêu cầu mượn đang trong trạng thái chờ duyệt (1 – 3 ngày).
   - Xem toàn bộ lịch sử mượn & hoàn trả: tình trạng sách khi trả (*Nguyên vẹn, Hư hỏng nhẹ, Hư hỏng nặng, Mất tài liệu*), tiền bồi thường và ghi chú kiểm định của thủ thư.

---

## 🚀 Hướng dẫn cài đặt & khởi chạy

### Bước 1: Cài đặt thư viện dependencies
Mở Terminal / PowerShell tại thư mục `mobile`:
```bash
cd mobile
npm install
```

---

### Bước 2: Chạy ứng dụng

Bạn có 3 cách để trải nghiệm ứng dụng:

#### 🌟 CÁCH 1: Chạy trên điện thoại thật qua ứng dụng Expo Go (KHUYÊN DÙNG - DỄ NHẤT)
1. Tải ứng dụng **Expo Go** miễn phí trên điện thoại:
   - **Android:** Tải trên Google Play Store (tìm kiếm `Expo Go`).
   - **iOS (iPhone):** Tải trên App Store (tìm kiếm `Expo Go`).
2. Đảm bảo **điện thoại và máy tính kết nối chung một mạng Wi-Fi**.
3. Tại thư mục `mobile`, chạy lệnh:
   ```bash
   npx expo start
   ```
4. Mở ứng dụng Expo Go trên điện thoại và quét mã QR hiển thị trên màn hình terminal:
   - Với Android: Bấm nút "Scan QR Code" trong ứng dụng Expo Go.
   - Với iPhone: Dùng ứng dụng Camera mặc định quét mã QR để mở trong Expo Go.

> 💡 **Mẹo kết nối Backend từ điện thoại thật:**
> - Máy tính của bạn có địa chỉ IPv4 nội bộ (ví dụ: `192.168.1.25`).
> - Khi mở app, tại màn hình Đăng nhập (hoặc tab Tài khoản), bấm nút **"Cài đặt Server"** và nhập: `http://<IP_MÁY_TÍNH>:8080/api` (ví dụ: `http://192.168.1.25:8080/api`).
> - Bấm **"Kiểm tra kết nối"** để đảm bảo app đã thông với Backend Spring Boot!

---

#### CÁCH 2: Chạy trên máy ảo Android Emulator
1. Khởi động Android Emulator từ Android Studio.
2. Tại thư mục `mobile`, chạy lệnh:
   ```bash
   npx expo start --android
   ```
3. Ứng dụng sẽ tự động mở trên máy ảo. Địa chỉ API mặc định cho máy ảo là: `http://10.0.2.2:8080/api`.

---

#### CÁCH 3: Chạy trực tiếp trên trình duyệt Web (Không cần điện thoại)
Tại thư mục `mobile`, chạy lệnh:
```bash
npx expo start --web
```
Trình duyệt sẽ tự động mở tại `http://localhost:8081` và kết nối với Backend tại `http://localhost:8080/api`.

---

## 🔑 Tài khoản mẫu trải nghiệm

- **Bạn đọc:**
  - Email: `reader@library.local`
  - Mật khẩu: `Reader@123`
- **Thủ thư:**
  - Email: `admin@library.local`
  - Mật khẩu: `Admin@123`
- Hoặc bấm nút **"Đăng ký ngay"** trên ứng dụng để tạo tài khoản mới.

---

## 📂 Cấu trúc thư mục mã nguồn

```
mobile/
├── package.json               # Cấu hình thư viện React Native & Expo
├── app.json                   # Cấu hình định danh & biểu tượng ứng dụng
├── babel.config.js            # Cấu hình Babel
├── App.js                     # Điểm khởi chạy gốc & Providers
└── src/
    ├── api/
    │   ├── client.js          # Axios client, interceptors, gán JWT token
    │   ├── auth.js            # API Đăng nhập, đăng ký, đổi mật khẩu
    │   ├── books.js           # API Danh mục sách, chi tiết, thể loại
    │   └── borrow.js          # API Mượn sách, lịch sử, huỷ yêu cầu
    ├── constants/
    │   ├── colors.js          # Bảng màu chuẩn thiết kế
    │   └── config.js          # Cấu hình IP và AsyncStorage
    ├── context/
    │   └── AuthContext.js     # Quản lý phiên đăng nhập & thông tin người dùng
    ├── components/
    │   ├── BookCard.js        # Card hiển thị sách (bìa, tên, tác giả, tồn kho)
    │   ├── Badge.js           # Huy hiệu trạng thái phiếu mượn & tình trạng sách
    │   ├── GuideModal.js      # Modal hướng dẫn 4 bước trả sách tại quầy
    │   └── ServerConfigModal.js # Modal đổi địa chỉ IP Backend trực tiếp trên app
    ├── screens/
    │   ├── LoginScreen.js     # Màn hình đăng nhập
    │   ├── RegisterScreen.js  # Màn hình đăng ký thẻ bạn đọc
    │   ├── HomeScreen.js      # Tab Trang chủ
    │   ├── CatalogScreen.js   # Tab Tra cứu danh mục sách & lọc thể loại
    │   ├── BookDetailScreen.js # Màn hình chi tiết sách & gửi yêu cầu mượn
    │   ├── MyLoansScreen.js   # Tab Sách của tôi (Đang mượn / Chờ duyệt / Lịch sử)
    │   └── ProfileScreen.js   # Tab Tài khoản & thẻ bạn đọc điện tử
    └── navigation/
        └── AppNavigator.js    # Cấu hình React Navigation (Bottom Tabs + Stacks)
```

