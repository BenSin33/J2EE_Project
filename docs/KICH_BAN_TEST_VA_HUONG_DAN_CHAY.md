# KỊCH BẢN KIỂM THỬ TOÀN DIỆN (E2E) & HƯỚNG DẪN CHẠY DỰ ÁN — MANGAHUB

> **Phiên bản kiến trúc:** 5 Microservices Docker (Spring Boot 4.1.1 + Spring Cloud 2025.1.2 + Java 21) + Frontend Next.js 16 + Supabase PostgreSQL  
> **Mục tiêu tài liệu:** Hướng dẫn cách khởi động/làm mới sạch toàn bộ hệ thống và cung cấp kịch bản kiểm thử từng bước (kèm kết quả mong đợi) để nhóm tự kiểm tra, chụp ảnh báo cáo và demo trực tiếp trước giảng viên.

---

## PHẦN 1: HƯỚNG DẪN CHẠY & LÀM MỚI HỆ THỐNG TỪ ĐẦU

### 1.1. Yêu cầu môi trường trước khi chạy
- **Docker Desktop** đang mở và chạy chế độ Linux Containers.
- **Node.js >= 20** (để chạy Next.js Frontend).
- **File biến môi trường (tùy chọn cho Gmail SMTP thật):** Sao chép `.env.docker.example` thành `.env` tại thư mục gốc `J2EE_Project/` và điền `SPRING_MAIL_USERNAME`, `SPRING_MAIL_PASSWORD` (App Password Gmail 16 ký tự) nếu muốn gửi thư thật tới hộp thư Gmail.
- **Lưu ý mạng Việt Nam khi cào MangaDex:** Nếu mạng ISP (Viettel/VNPT/FPT) chặn `api.mangadex.org`, bật **Cloudflare WARP (1.1.1.1)** trước khi cào truyện mới.

### 1.2. Các bước làm mới sạch & khởi động toàn bộ hệ thống

#### Bước 1: Làm mới và khởi chạy 5 Microservices trong Docker
Mở PowerShell tại thư mục gốc `d:\MCRo VSCODE\J2EE_Project`:

```powershell
# Dừng và gỡ các container cũ để làm mới sạch
docker compose down

# Build lại image mới nhất và khởi chạy ngầm 5 Microservices
docker compose up --build -d

# Kiểm tra cả 5 container đều lên trạng thái healthy (chờ ~30–45 giây)
docker compose ps
```

**Danh sách 5 dịch vụ & cổng kiểm tra:**
| Service | Container | Cổng | Đường dẫn kiểm tra |
| :--- | :--- | :-: | :--- |
| Eureka Discovery Server | `mangahub-discovery-server` | `8761` | `http://localhost:8761` |
| Spring Cloud API Gateway | `mangahub-api-gateway` | `8080` | `http://localhost:8080/swagger-ui/index.html` |
| Manga Core Service | `mangahub-core-service` | `8081` | `http://localhost:8081/actuator/health` |
| Payment Service (VNPay) | `mangahub-payment-service` | `8082` | `http://localhost:8082/actuator/health` |
| Notification & Mail Service | `mangahub-notification-mail-service` | `8083` | `http://localhost:8083/actuator/health` |

> **Mẹo kiểm tra nhanh tài nguyên RAM:** Chạy `docker stats --no-stream` để xem mức sử dụng RAM thực tế của 5 container (tổng thường < 1.2 GB).

#### Bước 2: Làm mới cache và khởi chạy Frontend Next.js (Port 3000)
Mở cửa sổ PowerShell thứ 2 tại `d:\MCRo VSCODE\J2EE_Project\manga-frontend-services`:

```powershell
# Xóa cache build cũ .next để làm mới hoàn toàn giao diện
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Khởi động Next.js Dev Server
npm.cmd run dev
```

Mở trình duyệt truy cập **`http://localhost:3000`**.

#### Bước 3: Chạy bộ Unit & Integration Test tự động (tùy chọn khi giảng viên yêu cầu xem Test)
```powershell
cd d:\MCRo VSCODE\J2EE_Project\manga-backend-services
.\mvnw.cmd test
```

---

## PHẦN 2: KỊCH BẢN KIỂM THỬ END-TO-END (10 LUỒNG TRỌNG TÂM)

### Kịch bản 1: Kiểm tra hạ tầng 5 Microservices & Service Discovery (Eureka + Gateway)
- **Mục tiêu:** Chứng minh kiến trúc 5 Microservices hoạt động đồng bộ, đăng ký thành công về Eureka và định tuyến qua API Gateway.
- **Các bước thực hiện:**
  1. Mở `http://localhost:8761` trên trình duyệt.
  2. Kiểm tra bảng **Instances currently registered with Eureka**.
  3. Mở `http://localhost:8080/swagger-ui/index.html` để xem tài liệu OpenAPI đi qua `api-gateway`.
- **Kết quả mong đợi:**
  - Đủ **4 client services** hiển thị màu xanh **`UP`**: `API-GATEWAY`, `MANGA-CORE-SERVICE`, `PAYMENT-SERVICE`, `NOTIFICATION-MAIL-SERVICE`.
  - Swagger UI tải thành công qua cổng `8080`.

---

### Kịch bản 2: Đăng nhập bằng Gmail (Google OAuth2) & Đồng bộ JWT
- **Mục tiêu:** Kiểm tra yêu cầu bắt buộc #1 (Login bằng Gmail / Google OAuth2) và cấp JWT Token.
- **Các bước thực hiện:**
  1. Mở `http://localhost:3000/login`.
  2. Nhấn nút **"Đăng nhập bằng Google"**.
  3. Chọn hoặc nhập tài khoản Gmail trong hộp thoại Google OAuth2 Account Chooser và bấm xác nhận.
- **Kết quả mong đợi:**
  - Hệ thống gọi `POST http://localhost:8080/api/auth/google` trả về `200 OK` kèm JWT Token.
  - Tự động chuyển hướng về Trang chủ (`/`), thanh Navbar hiển thị tên người dùng, ảnh đại diện và số dư Xu.
  - Nếu là tài khoản mới, `manga-core-service` gọi OpenFeign sang `notification-mail-service` gửi email chào mừng.

---

### Kịch bản 3: Quên mật khẩu & Đổi mật khẩu bằng mã OTP (Spring Email + OpenFeign)
- **Mục tiêu:** Kiểm tra yêu cầu bắt buộc #5 (Spring Email) và giao tiếp OpenFeign `manga-core-service` → `notification-mail-service`.
- **Các bước thực hiện:**
  1. Tại `http://localhost:3000/login`, nhấn **"Quên mật khẩu?"**.
  2. Nhập email của tài khoản đã tồn tại trong hệ thống và bấm **Gửi mã OTP**.
  3. Kiểm tra hộp thư Gmail (hoặc log container `docker compose logs --tail=50 notification-mail-service` nếu đang chạy chế độ dev chưa điền App Password) để lấy mã OTP 6 chữ số.
  4. Nhập mã OTP và mật khẩu mới → bấm **Đặt lại mật khẩu**.
  5. Thử đăng nhập lại với mật khẩu mới.
- **Kết quả mong đợi:**
  - `POST /api/auth/forgot-password` trả `200 OK`, tạo bản ghi trong `password_reset_tokens` (hạn 10 phút) và kích hoạt gửi HTML Email OTP.
  - `POST /api/auth/reset-password` trả `200 OK`, đánh dấu OTP đã dùng (`used = true`) và đăng nhập thành công bằng mật khẩu mới.

---

### Kịch bản 4: Thanh toán trực tuyến VNPay Sandbox (Ví Xu & Gói VIP)
- **Mục tiêu:** Kiểm tra yêu cầu bắt buộc #3 (VNPay Sandbox HMAC-SHA512), định tuyến `api-gateway` → `payment-service` và luồng OpenFeign cộng Xu + gửi biên lai.
- **Thông tin thẻ Test NCB Sandbox:**
  - Ngân hàng: **NCB**
  - Số thẻ: `9704198526191432198`
  - Tên chủ thẻ: `NGUYEN VAN A`
  - Ngày phát hành: `07/15`
  - Mã OTP: `123456`
- **Các bước thực hiện:**
  1. Đăng nhập tài khoản bất kỳ và truy cập `http://localhost:3000/payment`.
  2. Kiểm tra danh sách 4 gói nạp Xu hiển thị đầy đủ (10k / 20k / 50k + VIP 30 ngày / 100k + VIP 60 ngày) cùng hộp thông tin thẻ Test NCB có nút Copy 1 chạm.
  3. Chọn gói **Rương Xu Vàng + VIP (50.000đ)** → chọn ngân hàng **NCB** → nhấn **Thanh toán ngay với VNPay**.
  4. Trên trang `sandbox.vnpayment.vn`, nhập thông tin thẻ NCB ở trên → nhấn **Tiếp tục** → nhập OTP `123456` → **Thanh toán**.
  5. Chờ VNPay chuyển hướng tự động về `http://localhost:3000/payment/result`.
  6. Quay lại `http://localhost:3000/payment` để kiểm tra số dư Xu và bảng lịch sử giao dịch.
- **Kết quả mong đợi:**
  - Chuyển hướng sang cổng VNPay Sandbox thành công (không gặp lỗi `code=15` hết hạn thời gian).
  - Trang `/payment/result` xác thực chữ ký `HMAC-SHA512` thành công, hiển thị biên lai **Thanh toán thành công**.
  - Số dư Xu tăng thêm **+600 Xu**, trạng thái tài khoản chuyển thành **VIP (30 ngày)**, bảng lịch sử ghi nhận `SUCCESS`, và `notification-mail-service` gửi email biên lai.

---

### Kịch bản 5: Kiểm tra Phân quyền 4 nhóm người dùng (RBAC Security Gate)
- **Mục tiêu:** Kiểm tra yêu cầu bắt buộc #2 (Phân quyền 4 Role: `ROLE_USER`, `ROLE_UPLOADER`, `ROLE_MODERATOR`, `ROLE_ADMIN`).
- **Các bước thực hiện:**
  1. **Đăng nhập bằng tài khoản `ROLE_USER`** (ví dụ tài khoản vừa đăng nhập Google).
  2. Truy cập trực tiếp URL `http://localhost:3000/admin`.
  3. Truy cập `http://localhost:3000/crawler` và thử tìm kiếm truyện trên MangaDex.
  4. **Đăng xuất**, sau đó **đăng nhập bằng tài khoản `ROLE_ADMIN`** (`admin3` / `123456`).
  5. Truy cập lại `http://localhost:3000/admin`, `/admin/users`, `/admin/content`, `/admin/ui-config`, `/admin/infrastructure`.
- **Kết quả mong đợi:**
  - Với `ROLE_USER`: Màn hình `/admin` hiển thị trang chặn **`403 Forbidden — Không có quyền truy cập`**; API `/api/v1/crawler/**` từ chối truy cập với thông báo yêu cầu quyền `ADMIN`.
  - Với `ROLE_ADMIN`: Toàn bộ 5 trang quản trị mở đầy đủ thống kê, bảng phân quyền 4 Role, kiểm duyệt nội dung và công cụ cào MangaDex.

---

### Kịch bản 6: Cào truyện mới từ MangaDex API v5 & Lưu vào Supabase PostgreSQL
- **Mục tiêu:** Kiểm tra công cụ MangaDex Crawler, tự động đồng bộ ảnh bìa lên Cloudinary, lưu tác giả/thể loại/chương mới vào CSDL.
- **Các bước thực hiện:**
  1. Đảm bảo đang đăng nhập bằng tài khoản **`ROLE_ADMIN`**.
  2. Truy cập `http://localhost:3000/crawler` (hoặc `/uploader/mangadex`).
  3. Tại mục **Cách 2: Tìm kiếm trên MangaDex**, nhập từ khóa một bộ truyện mới chưa có trong hệ thống (ví dụ: `Sousou no Frieren`, `Dandadan`, `Chainsaw Man` hoặc `Blue Box`) và nhấn **Tìm kiếm**.
  4. Cấu hình ngôn ngữ chương (`vi` hoặc `en`), số chương tối đa (ví dụ `10`–`20` chương để cào nhanh), tick **Upload ảnh bìa lên Cloudinary**.
  5. Bấm nút **"Cào bộ này"** trên 1–2 bộ truyện mới chưa có nhãn *"Đã có trong hệ thống"*.
  6. Chờ thông báo màu xanh thành công và bấm **"Xem trang truyện"**.
- **Kết quả mong đợi:**
  - Truyện mới xuất hiện ngay trên Trang chủ (`/`), hiển thị đầy đủ ảnh bìa Cloudinary, mô tả, tác giả, danh sách thẻ thể loại và danh sách các chương vừa cào.

---

### Kịch bản 7: Trải nghiệm Trang chủ, Tìm kiếm động (JPA Specification) & Đọc truyện (HTTP/2 Image Proxy)
- **Mục tiêu:** Kiểm tra hiển thị Trang chủ, bộ lọc JPA Specification và khả năng tải 100% ảnh chương truyện qua Backend Image Proxy (không lỗi `ERR_BLOCKED_BY_ORB`, không bị cắt ảnh).
- **Các bước thực hiện:**
  1. Mở Trang chủ `http://localhost:3000/`, kiểm tra 3 khu vực: **Hero Banner**, **Truyện mới cập nhật** (chuyển đổi giữa chế độ List & Grid) và **Top Trending**.
  2. Sử dụng thanh tìm kiếm và bộ lọc thể loại để lọc theo tên truyện vừa cào (hoặc *Yofukashi no Uta*).
  3. Mở trang chi tiết truyện (`/manga/[id]`), bấm vào **Chương 1** (hoặc chương mới nhất vừa cào).
  4. Cuộn từ trang đầu đến trang cuối trên màn hình Reader (`/chapter/[chapterId]`), mở **SettingsModal** để đổi chế độ đọc (cuộn dọc / từng trang).
- **Kết quả mong đợi:**
  - Danh sách truyện lọc chính xác, không có lỗi console React duplicate key.
  - Toàn bộ ảnh trang truyện tải qua `/api/v1/chapters/{chapterId}/pages/{pageNumber}/image` đạt `200 OK`, hiển thị nguyên khung hình không bị cắt đáy.

---

### Kịch bản 8: Tương tác Độc giả (Bookmark, Lịch sử đọc UC09, Đánh giá 1–5 sao, Bình luận Spoiler & Thông báo)
- **Mục tiêu:** Kiểm tra trọn bộ tính năng tương tác cá nhân hóa của `ROLE_USER` và định tuyến sang `notification-mail-service`.
- **Các bước thực hiện:**
  1. Tại trang chi tiết truyện (`/manga/[id]`):
     - Bấm **Theo dõi (Bookmark)** truyện.
     - Chọn chấm điểm **5 sao** (Rating).
     - Viết một bình luận mới, tích chọn nhãn **Spoiler** → đăng bình luận → bấm vào lớp che mờ để kiểm tra tính năng Ẩn/Hiện Spoiler.
  2. Mở đọc một chương truyện bất kỳ và cuộn qua vài trang để kích hoạt tự động lưu tiến độ đọc.
  3. Kiểm tra lần lượt 3 trang cá nhân:
     - `http://localhost:3000/library` (Tủ sách cá nhân)
     - `http://localhost:3000/history` (Lịch sử đọc & nút Đọc tiếp)
     - `http://localhost:3000/notifications` (Hộp thông báo — gọi sang `notification-mail-service`)
- **Kết quả mong đợi:**
  - Truyện vừa theo dõi xuất hiện trong `/library`.
  - Chương vừa đọc xuất hiện trong `/history` kèm đúng vị trí tiến độ.
  - Điểm trung bình sao và bình luận Spoiler lưu bền vững sau khi tải lại trang (`F5`).
  - Trang `/notifications` gọi `GET /api/v1/me/notifications` trả `200 OK` (không lỗi CORS / 500).

---

### Kịch bản 9: Kênh Uploader Studio (`/uploader`)
- **Mục tiêu:** Kiểm tra phân hệ sáng tạo nội dung của `ROLE_UPLOADER` / `ROLE_ADMIN`.
- **Các bước thực hiện:**
  1. Truy cập `http://localhost:3000/uploader`.
  2. Xem thống kê tổng quan, mở `/uploader/mangas` để xem danh sách truyện và trạng thái duyệt (`approved` / `pending`).
  3. Mở `/uploader/mangas/new` kiểm tra biểu mẫu tạo truyện mới và `/uploader/mangas/[id]` để kiểm tra màn hình quản lý chương & tải ảnh bìa Cloudinary.
- **Kết quả mong đợi:**
  - Các màn hình Uploader tải đầy đủ dữ liệu, phân tách rõ truyện của tài khoản đang đăng nhập và trạng thái kiểm duyệt.

---

### Kịch bản 10: Bảng tổng hợp kết quả kiểm thử (Checklist điền khi chạy thực tế)

| STT | Kịch bản kiểm thử | Yêu cầu tương ứng | Trạng thái | Ghi chú |
| :-: | :--- | :--- | :-: | :--- |
| 1 | Hạ tầng 5 Microservices Docker & Eureka (`8761`) + Gateway (`8080`) | Điểm cộng Microservices/Docker | ⬜ | |
| 2 | Đăng nhập Google OAuth2 & cấp JWT | Yêu cầu #1 | ⬜ | |
| 3 | Quên mật khẩu & Đổi mật khẩu bằng OTP (Spring Email + OpenFeign) | Yêu cầu #5 | ⬜ | |
| 4 | Thanh toán VNPay Sandbox + Cộng Xu/VIP + Email biên lai | Yêu cầu #3 & #5 | ⬜ | |
| 5 | Phân quyền 4 Role & Chặn `403 Forbidden` | Yêu cầu #2 | ⬜ | |
| 6 | Cào truyện mới từ MangaDex API v5 & Ảnh bìa Cloudinary | Crawler + JPA (#4) | ⬜ | |
| 7 | Trang chủ, Tìm kiếm Specification & Reader Image Proxy | Yêu cầu #4, #6, #7 | ⬜ | |
| 8 | Bookmark, Lịch sử đọc, Rating, Comment Spoiler & Notifications | Yêu cầu #4 & #7 | ⬜ | |
| 9 | Kênh Uploader Studio (`/uploader/**`) | Yêu cầu #2 & #7 | ⬜ | |
| 10 | Cổng quản trị Admin Master (`/admin/**`) | Yêu cầu #2 & #7 | ⬜ | |

---

## PHẦN 3: LỆNH XỬ LÝ SỰ CỐ NHANH KHI DEMO

| Tình huống gặp phải | Lệnh / Cách xử lý nhanh |
| :--- | :--- |
| Một container khởi động chậm hoặc báo `unhealthy` | `docker compose logs --tail=80 <tên-service>` (ví dụ `payment-service`), sau đó `docker compose restart <tên-service>` |
| VNPay trả lỗi `code=15` (hết hạn giao dịch) | Kiểm tra container `payment-service` đã có biến môi trường `TZ=Asia/Ho_Chi_Minh` trong `docker-compose.yml` |
| Cào MangaDex báo `502 BAD_GATEWAY` | Bật **Cloudflare WARP (1.1.1.1)** trên Windows rồi thử lại |
| Dừng sạch hệ thống sau khi demo xong | `docker compose down` và nhấn `Ctrl + C` ở cửa sổ Next.js |

