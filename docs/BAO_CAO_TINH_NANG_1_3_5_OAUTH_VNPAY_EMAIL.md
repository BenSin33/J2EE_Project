# BÁO CÁO TRIỂN KHAI TÍNH NĂNG ĐỒ ÁN CUỐI KỲ (MÔN J2EE)
## Các tính năng STT 1, 3, 5: Google OAuth2, Thanh toán VNPay & Spring Email

---

## 📌 1. TỔNG QUAN YÊU CẦU ĐÃ HOÀN THÀNH

Tài liệu này tổng hợp chi tiết kiến trúc, mã nguồn, cơ sở dữ liệu, API và giao diện của 3 tính năng trọng tâm theo yêu cầu của đồ án cuối kỳ môn J2EE:

| STT | Yêu cầu môn học | Trạng thái | Thành phần phụ trách |
|:---:|:---|:---:|:---|
| **1** | **Login bằng Gmail (Google OAuth2)** | ✅ **Hoàn thành** | Xác thực Token qua Google API, tự động đồng bộ User, cấp JWT Token, nút bấm Google trên UI. |
| **3** | **Thanh toán Online (VNPay Sandbox)** | ✅ **Hoàn thành** | Băm chữ ký HMAC-SHA512, tạo URL thanh toán, xử lý Return Callback, tự động cộng Xu & gia hạn VIP, lưu lịch sử giao dịch. |
| **5** | **Gửi email bằng Spring Email** | ✅ **Hoàn thành** | Cấu hình JavaMailSender, gửi mã OTP đặt lại mật khẩu, biên lai nạp xu VNPay, gửi thư chào mừng bằng HTML Template. |

---

## 🔐 2. TÍNH NĂNG 1: ĐĂNG NHẬP BẰNG GMAIL (GOOGLE OAUTH2)

### 2.1. Kiến trúc & Luồng hoạt động (Architecture Flow)
1. **Phía Client (Next.js)**: Người dùng bấm **"Đăng nhập bằng Google"** trên giao diện `/(auth)/login`. Client gửi thông tin token/email về Backend qua endpoint `/api/auth/google`.
2. **Xác thực Token (Backend)**: Backend sử dụng `RestTemplate` gọi đến dịch vụ thẩm định của Google:
   $$\text{URL: } \texttt{https://oauth2.googleapis.com/tokeninfo?id\_token=\{token\}}$$
   Trích xuất an toàn: `email`, `name`, `picture`, `sub` (Google User ID).
3. **Đồng bộ Cơ sở dữ liệu**:
   * Nếu `email` đã tồn tại: Cập nhật `avatar_url` và `provider_id` (nếu chưa có).
   * Nếu `email` chưa có: Tự động đăng ký User mới với vai trò `ROLE_USER`, mật khẩu ngẫu nhiên được mã hóa bằng BCrypt, `auth_provider = 'GOOGLE'`. Đồng thời gửi email chào mừng qua Spring Email.
4. **Cấp quyền truy cập**: Backend phát hành **JWT Bearer Token** cho phiên làm việc để người dùng sử dụng toàn bộ tính năng của hệ thống.

### 2.2. Chi tiết mã nguồn Backend & Frontend
* **DTO**: `com.manga.manga_backend_services.dto.request.GoogleLoginRequest`
* **Xử lý nghiệp vụ**: Phương thức `loginWithGoogle` trong `AuthService.java`
* **Controller**: `POST /api/auth/google` trong `AuthController.java`
* **Cấu hình bảo mật**: Mở quyền công khai trong `SecurityConfig.java` (`.requestMatchers("/api/auth/**").permitAll()`)
* **Giao diện**: Nút đăng nhập Google với logo chuẩn trong `manga-frontend-services/app/(auth)/login/page.tsx`

### 2.3. Cú pháp API
* **Endpoint**: `POST /api/auth/google`
* **Request Body**:
```json
{
  "idToken": "google_credential_or_id_token",
  "email": "user.google@gmail.com",
  "name": "Nguyen Van A",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```
* **Response Body (200 OK)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id": "e81d4a3b-...",
  "username": "nguyenvana",
  "email": "user.google@gmail.com",
  "role": "ROLE_USER",
  "avatarUrl": "https://example.com/avatar.jpg",
  "coins": 0,
  "isVip": false,
  "authProvider": "GOOGLE"
}
```

---

## 💳 3. TÍNH NĂNG 3: HỖ TRỢ THANH TOÁN ONLINE VỚI VNPAY

### 3.1. Nghiệp vụ MangaHub (Ví Xu & Gói VIP Độc Giả)
* Độc giả thanh toán nạp **Xu (Coins)** để mở khóa các chương truyện VIP/sớm, ủng hộ nhóm dịch.
* **Chính sách ưu đãi**:
  * **Túi Xu Đồng (10.000 VND)**: +100 Xu
  * **Túi Xu Bạc (20.000 VND)**: +220 Xu (+10% thưởng)
  * **Rương Xu Vàng + VIP (50.000 VND)**: +600 Xu (+20% thưởng) + **Kích hoạt VIP 30 ngày** 👑
  * **Kho Báu Kim Cương (100.000 VND)**: +1.300 Xu (+30% thưởng) + **Kích hoạt VIP 60 ngày** 👑

### 3.2. Tiêu chuẩn bảo mật VNPay Sandbox
* **Thuật toán ký số**: `HMAC-SHA512`
* **Thông số cấu hình Sandbox**:
  * `vnp_TmnCode`: `CGXZLS0Z`
  * `vnp_HashSecret`: `XNBCJFAKAZQSGZSSTGUBMVWFFWCGUSYQ`
  * `vnp_PayUrl`: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`
  * `vnp_ReturnUrl`: `http://localhost:3000/payment/result`
* **Quy trình kiểm tra chữ ký (Checksum Verification)**:
  Tất cả các tham số trả về (bắt đầu bằng `vnp_`) được sắp xếp theo bảng chữ cái alphabet, sau đó băm với khóa bí mật để so sánh với `vnp_SecureHash`. Đảm bảo dữ liệu giao dịch không bị giả mạo.

### 3.3. Chi tiết mã nguồn Backend & Frontend
* **Cấu hình & Thuật toán băm**: `com.manga.manga_backend_services.config.VNPayConfig`
* **Entity & Repository**:
  * `PaymentTransaction.java` (lưu mã `txnRef`, số tiền, xu cộng, trạng thái `PENDING`/`SUCCESS`/`FAILED`, ngân hàng)
  * `PaymentTransactionRepository.java`
* **Service**: `com.manga.manga_backend_services.service.PaymentService`
  * `createPaymentUrl`: Tạo URL điều hướng sang VNPay.
  * `handleVNPayCallback`: Kiểm tra kết quả, đối chiếu chữ ký `HMAC-SHA512`, cộng Xu và cấp hạn VIP vào User, tự động gọi `EmailService` gửi email biên lai xác nhận.
  * `getPackages`: Danh sách các gói nạp.
  * `getUserTransactions`: Phân trang lịch sử giao dịch của độc giả.
* **Controller**: `PaymentController.java`
  * `POST /api/v1/payment/create`: Tạo yêu cầu thanh toán
  * `GET /api/v1/payment/vnpay-callback`: Xử lý phản hồi từ cổng VNPay
  * `GET /api/v1/payment/packages`: Lấy danh sách gói nạp (công khai)
  * `GET /api/v1/payment/history`: Xem lịch sử giao dịch (yêu cầu đăng nhập)
* **Giao diện người dùng**:
  * `manga-frontend-services/app/payment/page.tsx`: Màn hình ví xu, chọn gói nạp, chọn ngân hàng thanh toán (NCB, VNPAYQR, Thẻ quốc tế), xem lịch sử giao dịch.
  * `manga-frontend-services/app/payment/result/page.tsx`: Màn hình tiếp nhận kết quả giao dịch và thông báo trạng thái.

### 3.4. Thông tin thẻ Test VNPay Sandbox (Để demo với GV)
Khi bấm thanh toán chuyển sang cổng VNPay, chọn phương thức **Thẻ nội địa & tài khoản ngân hàng** -> Chọn ngân hàng **NCB**:
* **Số thẻ**: `9704198526191432198`
* **Tên chủ thẻ**: `NGUYEN VAN A`
* **Ngày phát hành**: `07/15`
* **Mật khẩu OTP**: `123456`

---

## 📧 4. TÍNH NĂNG 5: GỬI EMAIL BẰNG SPRING EMAIL

### 4.1. Cấu hình thư viện
Được khai báo trong `pom.xml`:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
```

Cấu hình trong `application.properties`:
```properties
spring.mail.host=${SPRING_MAIL_HOST:smtp.gmail.com}
spring.mail.port=${SPRING_MAIL_PORT:587}
spring.mail.username=${SPRING_MAIL_USERNAME:mangahub.j2ee@gmail.com}
spring.mail.password=${SPRING_MAIL_PASSWORD:}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
app.mail.enabled=${APP_MAIL_ENABLED:true}
```

### 4.2. Dịch vụ Spring Email (`EmailService.java`)
Sử dụng `JavaMailSender` và `MimeMessageHelper` để biên soạn và gửi các thư điện tử dạng HTML chuyên nghiệp:
1. **Gửi mã xác thực OTP khôi phục mật khẩu (`sendOtpEmail`)**:
   * Khối OTP lớn nổi bật (hiệu lực 10 phút).
   * Cảnh báo bảo mật tài khoản.
2. **Gửi biên lai nạp xu VNPay thành công (`sendPaymentReceiptEmail`)**:
   * Bảng chi tiết mã giao dịch `txnRef`, số tiền (VND), số xu cộng thêm.
   * Gửi tự động ngay khi VNPay xác nhận thanh toán thành công.
3. **Gửi email chào mừng thành viên (`sendWelcomeEmail`)**:
   * Tự động gửi khi người dùng đăng ký tài khoản mới hoặc đăng nhập lần đầu qua Google.

### 4.3. Luồng Quên mật khẩu & Đổi mật khẩu với OTP
* **Entity**: `PasswordResetToken.java` (lưu email, mã OTP 6 số, thời gian hết hạn 10 phút, trạng thái `used`).
* **APIs**:
  * `POST /api/auth/forgot-password`: Kiểm tra email trong hệ thống -> sinh OTP ngẫu nhiên 6 số -> lưu DB -> gửi thư qua Spring Email.
  * `POST /api/auth/reset-password`: Kiểm tra mã OTP và thời hạn -> mã hóa mật khẩu mới bằng BCrypt -> đánh dấu mã OTP đã sử dụng.
* **Giao diện**: Tích hợp luồng khôi phục tài khoản trực tiếp trong `login/page.tsx` (có nút *"Quên mật khẩu?"*).

---

## 🗄️ 5. CƠ SỞ DỮ LIỆU & TỰ ĐỘNG MIGRATION

Các bảng và cột mới được quản lý tập trung và tự động đồng bộ lên **Cloud PostgreSQL (Supabase)** khi ứng dụng khởi động thông qua `DatabaseInitRunner.java` và script `Database/migrations/004_payment_and_oauth_fields.sql`:

```sql
-- 1. Bổ sung các trường trên bảng users
ALTER TABLE users ADD COLUMN IF NOT EXISTS coins BIGINT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS vip_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'LOCAL';
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id VARCHAR(100);

-- 2. Bảng quản lý giao dịch VNPay
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    amount BIGINT NOT NULL,
    coins_added BIGINT DEFAULT 0,
    order_info TEXT,
    txn_ref VARCHAR(100) NOT NULL UNIQUE,
    vnp_transaction_no VARCHAR(100),
    bank_code VARCHAR(50),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Bảng lưu mã xác thực OTP gửi qua Spring Email
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(100) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    expiry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🧪 6. KIỂM THỬ TỰ ĐỘNG (AUTOMATED TESTS)

Đã viết thêm 2 bộ kiểm thử chuyên sâu cho các tính năng mới:
1. `PaymentServiceTests.java`:
   * `testCreatePaymentUrlSuccess`: Kiểm tra tạo link VNPay đầy đủ tham số và chữ ký bảo mật.
   * `testHandleVNPayCallbackSuccess`: Kiểm tra đối soát chữ ký, cập nhật trạng thái `SUCCESS`, cộng số dư xu, kích hoạt VIP và gửi email biên lai.
   * `testGetPackages`: Kiểm tra danh sách các gói nạp.
2. `AuthEmailServiceTests.java`:
   * `testGoogleLoginCreatesNewUser`: Kiểm tra đăng nhập Google tự động tạo tài khoản và gửi email chào mừng.
   * `testForgotPasswordGeneratesOtpAndSendsEmail`: Kiểm tra sinh mã OTP và gửi email khôi phục.
   * `testResetPasswordSuccess`: Kiểm tra đổi mật khẩu bằng OTP hợp lệ.

**Kết quả kiểm thử toàn bộ hệ thống**:
```
[INFO] Running com.manga.manga_backend_services.service.PaymentServiceTests
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.manga.manga_backend_services.service.AuthEmailServiceTests
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] Tests run: 58, Failures: 0, Errors: 0, Skipped: 1
[INFO] Total time: 26.858 s
```

---

## 🚀 7. HƯỚNG DẪN CHẠY & KIỂM THỬ DEMO

### Bước 1: Khởi động Backend
```bash
cd manga-backend-services
./mvnw.cmd spring-boot:run
```
* Xem tài liệu API tại: `http://localhost:8080/swagger-ui.html`

### Bước 2: Khởi động Frontend
```bash
cd manga-frontend-services
npm run dev
```
* Mở trình duyệt tại: `http://localhost:3000`

### Bước 3: Các kịch bản demo
1. **Demo Google Login**:
   * Truy cập `http://localhost:3000/login` -> Bấm nút **"Đăng nhập bằng Google"**.
2. **Demo Quên mật khẩu qua Spring Email**:
   * Tại trang đăng nhập, bấm **"Quên mật khẩu?"** -> Nhập email -> Nhận mã OTP và cập nhật mật khẩu mới.
3. **Demo Nạp Xu VNPay**:
   * Đăng nhập tài khoản -> Bấm menu **"Nạp Xu (VNPay)"** hoặc truy cập `http://localhost:3000/payment`.
   * Chọn gói nạp (Ví dụ: 50.000 VND để nhận 600 Xu + 30 ngày VIP) -> Chọn ngân hàng NCB -> Bấm thanh toán để sang cổng VNPay Sandbox -> Nhập thông tin thẻ test mục 3.4 -> Hệ thống ghi nhận thành công, cộng xu và thông báo gửi email biên lai!
