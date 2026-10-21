# Library Management - Bài tập 1 (Fresher Java)

Hệ thống quản lý thư viện xây dựng bằng **Spring Boot + Spring Data JPA**, đáp ứng đầy đủ yêu cầu
trong file *Lộ trình đào tạo Fresher Java* (mục **Bài tập 1**).

## 1. Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Framework | Spring Boot 3.2.5 (Java 17) |
| Bảo mật | Spring Security + JWT (JJWT) |
| Dữ liệu | Spring Data JPA (Hibernate) + MySQL |
| Migration | Liquibase |
| Validate | Jakarta Bean Validation |
| Log | Log4j2 (console + file, rolling) |
| AOP | Spring AOP (ghi log request/response) |
| Mail | Spring Mail (JavaMailSender) |
| Doc API | springdoc-openapi (Swagger UI) |
| Build | Maven |
| Test | JUnit 5 + Mockito + AssertJ |

## 2. Cách chạy

```bash
# 1. Tạo database MySQL
CREATE DATABASE library_db CHARACTER SET utf8mb4;

# 2. Cấu hình lại username/password MySQL trong:
src/main/resources/application.yml (mục spring.datasource)

# 3. Build & chạy (Liquibase sẽ tự tạo bảng khi app khởi động)
mvn spring-boot:run
```

- App chạy tại: `http://localhost:8080`
- Swagger UI (Doc API): `http://localhost:8080/swagger-ui.html`
- Tài khoản Admin mặc định (tự tạo lúc khởi động - xem `DataSeeder.java`):
  - Email: `admin@library.local`
  - Password: `Admin@123`
- File CSV mẫu để test chức năng import sách: `sample-data/books-import-sample.csv`

> Gửi email thật cần cấu hình `SPRING_MAIL_USERNAME`, `SPRING_MAIL_PASSWORD` (Google App Password)
> và `APP_MAIL_ENABLED=true`. Mặc định `APP_MAIL_ENABLED=false` — hệ thống chỉ **ghi log nội dung mail**
> ra console/file để vẫn test được trọn luồng nghiệp vụ (đăng ký, quên mật khẩu, đổi email...)
> mà không cần SMTP server thật.

## 3. Chạy test

```bash
mvn test
```

## 4. Bảng map: Yêu cầu đề bài ↔ Code triển khai

| # | Yêu cầu trong file đề bài | Nơi triển khai |
|---|---|---|
| 1 | Màn hình Login | `AuthController.login()` + `AuthServiceImpl.login()` + `JwtTokenProvider` |
| 2 | Màn hình Logout | `AuthController.logout()` + `TokenBlacklistService` (chặn token đã logout qua `JwtAuthenticationFilter`) |
| 3 | Đăng ký thành viên (email, password) + xác thực qua email | `AuthController.register()`/`verifyEmail()` + `AuthServiceImpl` + `EmailServiceImpl` + entity `VerificationToken` |
| 4 | 2 role Admin/User; mỗi tài khoản thuộc đúng một **nhóm chức năng** | `entity/Permission`, `PermissionGroup`, `Account.permissionGroup` (N-1); `@PreAuthorize("hasAuthority(...)")` trên từng API; `PermissionController` + `PermissionServiceImpl`; `UserPrincipal` nạp quyền từ nhóm. Nhóm toàn quyền và `PERMISSION_MANAGE` chỉ dành cho tài khoản ADMIN. |
| 5 | Reset mật khẩu / Đổi mật khẩu / Đổi email (có xác nhận) | `AuthController` + `AuthServiceImpl`: `forgotPassword/resetPassword/changePassword/requestChangeEmail/confirmChangeEmail` |
| 6 | Quản lý sách: search phân trang (10 record/trang), Specification | `BookController.search()` + `BookServiceImpl.search()` + `BookSpecification` |
| 7 | Thêm/sửa/xoá sách (RESTful + validate) | `BookController` (POST/PUT/DELETE `/api/books`) + `BookRequest` (Bean Validation) |
| 8 | Import sách từ CSV, giới hạn dung lượng file | `BookController.importCsv()` + `BookServiceImpl.importFromCsv()` (giới hạn 5MB, validate đuôi `.csv`) |
| 9 | Quản lý Member: search nhiều điều kiện (tên, sách đã mượn, khoảng ngày sinh...) | `MemberController.search()` + `MemberServiceImpl` + `MemberSpecification` (validate `dobFrom <= dobTo`) |
| 10 | Tạo mới / cập nhật Member | `MemberController` (POST/PUT `/api/members`) + `MemberServiceImpl` |
| 11 | API mượn sách (check tồn kho, 1 user chỉ mượn 1 loại sách/thời điểm) | `BorrowController.borrow()` + `BorrowServiceImpl.borrowBook()` |
| 12 | API trả sách | `BorrowController.returnBook()` + `BorrowServiceImpl.returnBook()` |
| 13 | Màn hình Config hệ thống: API bật/tắt + xem maintenance mode | `SystemConfigController` + `SystemConfigServiceImpl` + `MaintenanceModeFilter` (chặn toàn bộ API khi bật) |
| 14 | Validate mọi API create/update | `@Valid` + Bean Validation annotations trên toàn bộ `dto/request/*`, xử lý lỗi tại `GlobalExceptionHandler` |
| 15 | Clean code, Java Coding Convention | Đặt tên chuẩn, tách rõ layer Controller–Service–Repository–DTO–Entity, Javadoc giải thích nghiệp vụ |
| 16 | Hibernate: quan hệ 1-1, 1-N, N-N | `Account`⟷`Member` (1-1), `Category`→`Book` (1-N), `Book`⟷`Author` (N-N), `Member`/`Book`→`BorrowRecord` (1-N) |
| 17 | Dùng Lombok | `@Data/@Builder/@NoArgsConstructor/@AllArgsConstructor/@RequiredArgsConstructor` trên toàn bộ entity/DTO/service |
| 18 | CRUD dùng transaction, rollback khi lỗi | `@Transactional` trên mọi method ghi dữ liệu (`AuthServiceImpl`, `BookServiceImpl`, `MemberServiceImpl`, `BorrowServiceImpl`) |
| 19 | Dùng log4j log mọi chức năng (request/response), console + file | `log4j2.xml` (Console + RollingFile appender) + `LoggingAspect` (AOP tự log mọi API) |
| 20 | Handle exception trước khi trả về client | `GlobalExceptionHandler` (`@RestControllerAdvice`) xử lý tập trung toàn bộ exception |
| 21 | Dùng AOP (vd cho log hoặc xác thực) | `aop/LoggingAspect.java` (`@Around` quanh toàn bộ Controller) |
| 22 | Refresh token: còn hạn thì tự cấp token mới thay vì 401 | `AuthServiceImpl.refreshToken()` (còn hạn → cấp access+refresh mới; hết hạn/invalid → 401 qua `UnauthorizedException`) |
| 23 | Viết JUnit test cho API | `src/test/java/.../service/*Test.java` (BorrowServiceImplTest, BookServiceImplTest, AuthServiceImplTest) |
| 24 | Viết migration DB bằng Liquibase | `db/changelog/db.changelog-master.xml` + 11 changeset trong `db/changelog/changes/` |
| 25 | Viết Doc API | `SwaggerConfig.java` + annotation `@Tag` trên Controller → truy cập `/swagger-ui.html` |

## 5. Danh sách API chính

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Đăng ký |
| POST | `/api/auth/verify-email` | Public | Xác thực bằng email và mã 6 chữ số |
| POST | `/api/auth/resend-verification` | Public | Gửi lại mã xác thực |
| POST | `/api/auth/login` | Public | Đăng nhập |
| POST | `/api/auth/logout` | Đã đăng nhập | Đăng xuất |
| POST | `/api/auth/refresh` | Public | Lấy access token mới |
| POST | `/api/auth/change-password` | Đã đăng nhập | Đổi mật khẩu |
| POST | `/api/auth/forgot-password` | Public | Quên mật khẩu |
| POST | `/api/auth/reset-password` | Public | Đặt lại mật khẩu |
| POST | `/api/auth/change-email` | Đã đăng nhập | Yêu cầu đổi email |
| POST | `/api/auth/confirm-email-change` | Public | Xác nhận đổi email bằng mã 6 chữ số |
| GET | `/api/books` | `BOOK_VIEW` | Tìm kiếm sách (phân trang) |
| POST/PUT/DELETE | `/api/books/**` | `BOOK_CREATE/UPDATE/DELETE` | Thêm/sửa/xoá sách |
| POST | `/api/books/import` | `BOOK_IMPORT` | Import sách từ CSV |
| GET/POST/PUT/DELETE | `/api/members/**` | `MEMBER_VIEW/CREATE/UPDATE/DELETE` | Quản lý member |
| POST | `/api/borrow` | `BORROW_USE` | Mượn sách |
| POST | `/api/borrow/{id}/return` | `BORROW_USE` | Trả sách |
| GET | `/api/borrow/history` | `BORROW_USE` | Lịch sử mượn của bản thân |
| GET/POST | `/api/categories` | Đã đăng nhập / ADMIN | Danh sách / tạo thể loại (cho dropdown UI) |
| GET | `/api/config` | `CONFIG_VIEW` | Xem config hệ thống |
| PUT | `/api/config/maintenance` | `CONFIG_UPDATE` | Bật/tắt maintenance mode |
| GET | `/api/permissions`, `/api/permission-groups`, `/api/accounts` | `PERMISSION_MANAGE` | Xem quyền, nhóm quyền, tài khoản |
| POST/PUT/DELETE | `/api/permission-groups/**` | `PERMISSION_MANAGE` | Tạo/sửa/xoá nhóm quyền |
| PUT | `/api/accounts/{id}/permission-groups` | `PERMISSION_MANAGE` | Gán nhóm quyền cho tài khoản |

## 5b. Phân quyền theo nhóm chức năng

- **Quyền nhỏ** (`permission`): `BOOK_VIEW/CREATE/UPDATE/DELETE/IMPORT`, `MEMBER_VIEW/CREATE/UPDATE/DELETE`,
  `BORROW_USE`, `CONFIG_VIEW/UPDATE`, `PERMISSION_MANAGE`.
- **Nhóm quyền** (`permission_group`): gom nhiều quyền nhỏ. `DataSeeder` tạo sẵn 5 nhóm: *Quản trị toàn quyền*,
  *CRUD sách*, *Quản lý thành viên*, *Mượn trả sách*, *Cấu hình hệ thống*. Admin có thể tạo/sửa/xoá nhóm trên UI.
- **Gán nhóm cho tài khoản** (`account.permission_group_id`): trên màn *Phân quyền* hoặc `PUT /api/accounts/{id}/permission-groups` với một `groupId`.
- Admin mặc định được gán nhóm *Quản trị toàn quyền*; tài khoản đăng ký mới được gán nhóm *Mượn trả sách*.
- Admin không tự đổi nhóm quyền của chính mình (tránh tự khoá). Đổi nhóm quyền có hiệu lực ngay ở backend;
  menu UI cập nhật sau khi người đó đăng nhập lại.

## 6. Tự đánh giá mức độ hoàn thiện (đối chiếu nguyên văn đề bài)

**Đã đáp ứng đầy đủ:** toàn bộ chức năng + yêu cầu kỹ thuật liệt kê ở mục 4 phía trên.

**3 điểm khác với đề bài / còn giới hạn — nêu rõ để không gây hiểu nhầm:**

1. **Tài khoản admin**: đề bài giả định `admin/admin` (username/password thuần). Hệ thống này dùng
   **email** làm định danh đăng nhập cho mọi tài khoản (kể cả admin) để đồng nhất thiết kế, nên admin
   mặc định là `admin@library.local / Admin@123` (xem `DataSeeder.java`) thay vì literal `admin/admin`.
2. **Xác minh email**: đăng ký, đặt lại mật khẩu và đổi email đều dùng mã xác thực 6 chữ số có hiệu lực 10 phút.
3. **JUnit test**: có cả unit test tầng Service (mock, `service/*Test.java`) **và** integration test gọi
   thẳng API qua MockMvc (`controller/AuthControllerIntegrationTest.java`, chạy qua toàn bộ Spring
   Security filter chain thật). Tuy nhiên chưa phủ hết 100% endpoint — chỉ test các case quan trọng nhất
   (validate lỗi, chưa verify email không login được, gọi API không có token bị chặn 401...).
4. **Giao diện Web**: đã làm bằng React (thư mục `frontend/`, xem `frontend/README.md`). Do môi trường
   dựng project không có mạng nên chưa chạy `npm install` / build thật; mã nguồn đã được kiểm tra
   cú pháp JSX nhưng chưa chạy thử trên trình duyệt — lần đầu chạy `npm install && npm run dev` nếu
   có lỗi nhỏ, hãy báo lại để chỉnh.

Ngoài các điểm trên, không còn thiếu sót nào khác so với yêu cầu gốc.

## 7. Một số giả định (assumptions)

- Hạn mượn sách mặc định: **14 ngày** kể từ ngày mượn (`BorrowServiceImpl.LOAN_PERIOD_DAYS`).
- "1 user chỉ mượn 1 loại sách tại 1 thời điểm" được hiểu là: khi đang có **bất kỳ** phiếu mượn nào
  ở trạng thái `BORROWED`, user đó không được tạo phiếu mượn mới cho tới khi trả sách đang mượn.
- Admin tạo Member trực tiếp (`POST /api/members`) thì coi như đã xác thực email luôn (khác với
  luồng tự đăng ký `POST /api/auth/register` bắt buộc phải xác thực qua email).
- Dùng `@Version` (optimistic locking) trên `Book.quantityAvailable` để tránh lệch tồn kho khi có
  nhiều request mượn sách cùng lúc.
