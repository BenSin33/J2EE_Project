# KẾ HOẠCH REFACTOR BÁO CÁO ĐỒ ÁN MANGAHUB & PHÂN CÔNG 4 THÀNH VIÊN

> **Tài liệu mẫu tham chiếu:** [`Mau_BaoCaoDoAnJava_MinieShop.pdf`](../Mau_BaoCaoDoAnJava_MinieShop.pdf) (31 trang) & [`Mau_BaoCaoDoAnJava_MinieShop.docx`](../Mau_BaoCaoDoAnJava_MinieShop.docx)  
> **Đề tài nhóm:** **XÂY DỰNG HỆ THỐNG ĐỌC TRUYỆN TRANH TRỰC TUYẾN ĐA NGUỒN — MANGAHUB**  
> **Hiện trạng hệ thống:** 21 màn hình Next.js 16 + 5 Microservices Docker (Spring Boot 4.1.1 / Spring Cloud 2025.1.2) + Supabase PostgreSQL + đạt 9/9 yêu cầu bắt buộc (đã kiểm thử E2E 8/8 PASS).

---

## PHẦN 1: KẾ HOẠCH REFACTOR CẤU TRÚC BÁO CÁO (MINIESHOP → MANGAHUB)

File mẫu MinieShop có bố cục ngắn gọn, trực quan, tập trung vào **Mô tả chức năng → ERD → Cây thư mục dự án → Ảnh chụp giao diện từng luồng → Kết luận**. Nhóm giữ nguyên chuẩn trình bày này của giảng viên nhưng nâng cấp nội dung tương xứng với hệ thống Microservices của MangaHub:

| Mục trong mẫu MinieShop | Refactor sang báo cáo **MangaHub** | Nguồn dữ liệu có sẵn trong Workspace |
| :--- | :--- | :--- |
| **Trang bìa & Lời cam đoan** *(Trang 1–2)* | Đổi tên đề tài thành: **"XÂY DỰNG HỆ THỐNG ĐỌC TRUYỆN TRANH TRỰC TUYẾN ĐA NGUỒN — MANGAHUB"**, cập nhật tên trường, GVHD, 4 thành viên và năm 2026. | Chỉnh trực tiếp từ [`Mau_BaoCaoDoAnJava_MinieShop.docx`](../Mau_BaoCaoDoAnJava_MinieShop.docx). |
| **Mục lục & Danh mục hình vẽ** *(Trang 3–5)* | Dùng tính năng **Automatic Table of Contents & Insert Table of Figures** của Word (tự động đánh số trang sau khi 4 người ghép bài, không gõ tay). | Cập nhật tự động ở bước ghép file cuối cùng. |
| **CHƯƠNG 1: YÊU CẦU CHỨC NĂNG** *(Trang 6–7)* | **1.1.1 Các chức năng cơ bản:** Chia rõ theo **5 nhóm người dùng** thực tế: *Khách (`Guest`)*, *Độc giả (`ROLE_USER`)*, *Nhóm dịch/Tác giả (`ROLE_UPLOADER`)*, *Kiểm duyệt viên (`ROLE_MODERATOR`)*, *Quản trị viên (`ROLE_ADMIN`)*.<br>**1.1.2 Các chức năng nâng cao:** Nêu bật *Google OAuth2*, *VNPay Sandbox (HMAC-SHA512)*, *Spring Email (OTP/Welcome/Biên lai)*, *Spring Security + Stateless JWT*, *Spring Data JPA + Specification*, *MangaDex API Crawler + HTTP/2 Image Proxy*, *Cloudinary WebP*, **và điểm cộng: Kiến trúc 5 Microservices (Spring Cloud Eureka, API Gateway, OpenFeign) đóng gói Docker Compose**. | [`BAO_CAO_TONG_HOP_DO_AN_CUOI_KY.md`](./BAO_CAO_TONG_HOP_DO_AN_CUOI_KY.md), [`Dac_ta_chuc_nang_Manga_v1_2.docx`](./Dac_ta_chuc_nang_Manga_v1_2.docx). |
| **CHƯƠNG 2: THIẾT KẾ** — **2.1 Cơ sở dữ liệu** *(Trang 8)* | Thay ERD MinieShop bằng **Sơ đồ ERD PostgreSQL (Supabase)** gồm **18+ bảng** thực tế (`users`, `password_reset_tokens`, `payment_transactions`, `mangas`, `chapters`, `chapter_pages`, `authors`, `tags`, `bookmarks`, `reading_history`, `manga_ratings`, `comments`, `chapter_reports`, `notifications`, `home_showcases`...) kèm bảng tóm tắt vai trò các nhóm bảng. | [`project_database_v2.sql`](../Database/project_database_v2.sql) & thư mục `Database/migrations/`. |
| **2.2 Cấu trúc dự án** *(Trang 9–13)* | **2.2.1 Kiến trúc Microservices & Backend:** Chèn **Sơ đồ kiến trúc 5 Microservices + Docker**, ảnh chụp **Eureka Dashboard (`http://localhost:8761`)**, ảnh **`docker compose ps`**, Swagger UI (`http://localhost:8080/swagger-ui/index.html`) và cây thư mục của 5 service (`discovery-server`, `api-gateway`, `manga-backend-services`, `payment-service`, `notification-mail-service`).<br>**2.2.2 Frontend (Next.js 16):** Ảnh chụp cây thư mục `manga-frontend-services` (`app/`, `components/`, `lib/`, `store/`, `types/`). | [`KIEN_TRUC_MICROSERVICE_5_SERVICES.md`](./KIEN_TRUC_MICROSERVICE_5_SERVICES.md), [`docker-compose.yml`](../docker-compose.yml). |
| **2.3 Giao diện** *(Trang 14–29)* | Chia làm **3 nhóm rõ ràng** (khoảng **32 hình chụp chất lượng cao** thay vì 54 hình lặp lại CRUD như mẫu):<br>• **2.3.1 Giao diện Xác thực, Email & Thanh toán VNPay** *(8 hình)*<br>• **2.3.2 Giao diện Quản trị (`Admin`/`Moderator`) & Kênh Uploader (`Uploader`)** *(13 hình)*<br>• **2.3.3 Giao diện Độc giả (`Guest`/`User`)** *(11 hình)* | Chụp trực tiếp trên `http://localhost:3000` (dữ liệu thật: *Yofukashi no Uta*, *SPY×FAMILY*, *Kage no Jitsuryokusha*). |
| **CHƯƠNG 3: KẾT LUẬN** *(Trang 30)* | **3.1 Phần trăm đóng góp của từng thành viên:** Bảng 4 thành viên (thêm cột *Nhiệm vụ chính đảm nhận*).<br>**3.2 Đánh giá kết quả & Hướng phát triển:** Tổng kết 9/9 tiêu chí bắt buộc + điểm cộng Microservices/Docker; nêu hướng phát triển (AI gợi ý/tóm tắt truyện, Redis Cache / Message Queue Kafka–RabbitMQ, Deploy Cloud Production, Mobile App). | Tổng hợp từ kết quả E2E 8/8 PASS. |
| **TÀI LIỆU THAM KHẢO** *(Trang 31)* | Thay toàn bộ tài liệu cũ (MoMo/o7planning) bằng link chính thống: Spring Boot 4, Spring Cloud (Eureka/Gateway/OpenFeign), VNPay Developer Sandbox, Google OAuth2, Next.js 16, Supabase PostgreSQL, Cloudinary, MangaDex API v5, Docker Compose. | Tham chiếu trực tiếp từ `pom.xml` & `package.json`. |

---

## PHẦN 2: PHÂN CHIA CÔNG VIỆC CHO 4 THÀNH VIÊN

Dựa theo lịch sử Git và phân công trong [`KeHoachPhatTrien_J2EE.md`](./KeHoachPhatTrien_J2EE.md), mỗi thành viên phụ trách đúng phân hệ code của mình (**~7–8 trang/người**, đồng đều về khối lượng viết và chụp ảnh minh họa):

### Tóm tắt phân công nhanh

| Thành viên | Nhánh Git | Mục phụ trách trong báo cáo | Số hình giao diện | Nhiệm vụ đặc biệt |
| :--- | :--- | :--- | :---: | :--- |
| **Thành viên 1** | `Quy` | Trang bìa, Lời cam đoan, `1.1.2`, `2.2.1`, `2.3.1` | 8 hình + ảnh kiến trúc | Ghép file cuối, cập nhật Mục lục & Danh mục hình, xuất PDF |
| **Thành viên 2** | `QuangMinh` | `1.1.1 (Uploader)`, `2.1 (CSDL ERD)`, `2.3.2b` | 7 hình + sơ đồ ERD | Xuất sơ đồ ERD chuẩn từ Supabase / DBeaver |
| **Thành viên 3** | `HoangAnh` | `1.1.1 (Guest/User)`, `2.2.2`, `2.3.3b` | 8 hình + cây thư mục FE | Chụp Reader 40 trang *Yofukashi no Uta* & tiến độ đọc |
| **Thành viên 4** | `Long` | `1.1.1 (Mod/Admin)`, `2.3.2a`, `2.3.3a`, Chương 3, TLTK | 9 hình | Tổng hợp Chương 3 (Kết luận, % đóng góp) & Tài liệu tham khảo |

---

### 👤 Thành viên 1 (Nhánh `Quy` — Nhóm trưởng / Auth, VNPay, Email, Microservices & Docker)

- **Mục phụ trách:**
  1. **Trang Bìa & Lời Cam Đoan:** Điền đầy đủ tên trường, khoa, giảng viên hướng dẫn, danh sách 4 thành viên, MSSV, lớp, năm 2026.
  2. **Mục 1.1.2 (Các chức năng nâng cao):** Mô tả Google OAuth2, VNPay Sandbox (HMAC-SHA512), Spring Email (OTP/Welcome/Biên lai), Spring Security + Stateless JWT, Spring Data JPA + Specification, MangaDex API + HTTP/2 Image Proxy, Cloudinary WebP và Kiến trúc 5 Microservices Docker.
  3. **Mục 2.2.1 (Kiến trúc Microservices & Cấu trúc Backend):**
     - Chèn sơ đồ kiến trúc 5 Microservices + Docker Compose (`mangahub-net`).
     - Chụp cây thư mục 5 service: `discovery-server`, `api-gateway`, `manga-backend-services`, `payment-service`, `notification-mail-service`.
     - Chụp **Eureka Dashboard (`http://localhost:8761`)** hiển thị 4 client `UP`, **Swagger UI (`http://localhost:8080/swagger-ui/index.html`)** và kết quả `docker compose ps`.
  4. **Mục 2.3.1 (Giao diện Xác thực, Email & Thanh toán VNPay — 8 hình):**
     - Đăng nhập (`/login`), Modal chọn tài khoản Google OAuth2, Đăng ký (`/register`), Quên mật khẩu nhập Email (`/forgot-password`), Hòm thư Gmail nhận mã OTP/Biên lai thanh toán, Nhập OTP đổi mật khẩu, Trang Ví Xu & Chọn gói nạp VNPay (`/payment`), Cổng thanh toán VNPay Sandbox & Trang kết quả giao dịch (`/payment/result`).
  5. **Tổng hợp cuối cùng:** Ghép 4 phần vào file Word mẫu, căn lề chuẩn, chạy Update Table of Contents & Table of Figures, xuất PDF nộp bài.
- **Tài liệu tham khảo sẵn có:**
  - [`BAO_CAO_TINH_NANG_1_3_5_OAUTH_VNPAY_EMAIL.md`](./BAO_CAO_TINH_NANG_1_3_5_OAUTH_VNPAY_EMAIL.md)
  - [`KIEN_TRUC_MICROSERVICE_5_SERVICES.md`](./KIEN_TRUC_MICROSERVICE_5_SERVICES.md)
  - [`docker-compose.yml`](../docker-compose.yml)

---

### 👤 Thành viên 2 (Nhánh `QuangMinh` — CSDL, Uploader Studio, Cloudinary & MangaDex Crawler)

- **Mục phụ trách:**
  1. **Mục 1.1.1 (phần `ROLE_UPLOADER`):** Mô tả chi tiết các chức năng quản lý đầu truyện cá nhân, tải ảnh bìa Cloudinary, upload chương truyện (ảnh lẻ / file `.zip` tự nén WebP), nhập truyện & đồng bộ chương từ MangaDex.
  2. **Mục 2.1 (Cơ sở dữ liệu — ERD):**
     - Xuất sơ đồ ERD rõ nét từ **Supabase Schema Visualizer** (hoặc DBeaver/DataGrip) thể hiện đầy đủ 18+ bảng và liên kết khóa ngoại.
     - Trình bày bảng mô tả ngắn gọn vai trò các nhóm bảng cốt lõi (`users`, `password_reset_tokens`, `payment_transactions`, `mangas`, `chapters`, `chapter_pages`, `authors`, `tags`, `bookmarks`, `reading_history`, `manga_ratings`, `comments`, `chapter_reports`, `notifications`, `home_showcases`).
  3. **Mục 2.3.2b (Giao diện Kênh Uploader & MangaDex Crawler — 7 hình):**
     - Tổng quan Uploader Studio (`/uploader`), Danh sách truyện của tôi (`/uploader/mangas`), Tạo truyện mới (`/uploader/mangas/new`), Chỉnh sửa truyện & tải ảnh bìa Cloudinary (`/uploader/mangas/[id]`), Upload chương ảnh/`.zip`, Nhập truyện từ MangaDex (`/uploader/mangadex`), Công cụ Crawler tìm kiếm & cào trực tiếp (`/crawler`).
- **Tài liệu tham khảo sẵn có:**
  - [`ENTITY_DTO_EXPLANATION.md`](./ENTITY_DTO_EXPLANATION.md)
  - [`Uploader_Flow.png`](./Uploader_Flow.png)
  - [`project_database_v2.sql`](../Database/project_database_v2.sql)

---

### 👤 Thành viên 3 (Nhánh `HoangAnh` — Cấu trúc Frontend, Reader, Tương tác Độc giả & Thông báo)

- **Mục phụ trách:**
  1. **Mục 1.1.1 (phần `Guest` & `ROLE_USER`):** Mô tả các chức năng đọc truyện, tự động lưu & khôi phục tiến độ đọc (UC09), tủ sách Bookmark (UC08), đánh giá 1–5 sao, bình luận gắn nhãn Spoiler và nhận thông báo chương mới.
  2. **Mục 2.2.2 (Cấu trúc dự án Frontend Next.js 16):**
     - Chụp 3–4 ảnh cây thư mục `manga-frontend-services` (`app/`, `components/`, `lib/`, `store/`, `types/`).
     - Giải thích ngắn gọn kiến trúc Frontend (Next.js 16 App Router, TypeScript, Tailwind CSS, Zustand State Management, Axios Interceptor tự động gắn JWT và xử lý hết hạn phiên).
  3. **Mục 2.3.3b (Giao diện Đọc truyện & Tương tác Độc giả — 8 hình):**
     - Chi tiết truyện *Yofukashi no Uta* (`/manga/[id]`), Khu vực Đánh giá 1–5 sao & Nút Theo dõi, Khu vực Bình luận & Ẩn/Hiện Spoiler, Màn hình đọc chương truyện Full 40 trang (`/chapter/[chapterId]`) kèm thanh tiến độ đọc, Modal Cài đặt chế độ đọc (`SettingsModal`), Tủ sách cá nhân (`/library`), Lịch sử đọc (`/history`), Hộp thông báo chương mới (`/notifications`).
- **Tài liệu tham khảo sẵn có:**
  - [`bookmark-library.md`](./bookmark-library.md)
  - [`comments.md`](./comments.md)
  - [`rating.md`](./rating.md)
  - [`notifications.md`](./notifications.md)
  - [`uc09-account-integration.md`](./uc09-account-integration.md)

---

### 👤 Thành viên 4 (Nhánh `Long` — Trang chủ, Admin Master, Phân quyền & Chương 3 Kết luận)

- **Mục phụ trách:**
  1. **Mục 1.1.1 (phần `ROLE_MODERATOR` & `ROLE_ADMIN`):** Mô tả chi tiết chức năng và ma trận phân quyền giữa Kiểm duyệt viên (`ROLE_MODERATOR`) và Quản trị viên tối cao (`ROLE_ADMIN`).
  2. **Mục 2.3.2a (Giao diện Quản trị Admin Master — 6 hình):**
     - Màn hình chặn phân quyền `403 Forbidden` (khi `ROLE_USER` cố truy cập `/admin`), Tổng quan Admin Master (`/admin`), Quản lý & Kiểm duyệt nội dung/Báo cáo chương lỗi (`/admin/content`), Quản lý người dùng & Phân quyền 4 Role + Ban/Mute (`/admin/users`), Cấu hình giao diện & Thể loại (`/admin/ui-config`), Giám sát hạ tầng & Cloudinary (`/admin/infrastructure`).
  3. **Mục 2.3.3a (Giao diện Trang chủ — 3 hình):**
     - Trang chủ phần Hero Banner + Thanh tìm kiếm/Lọc thể loại (`/`), Phần Truyện mới cập nhật (`Recently Updated` — dạng List & Grid), Phần Bảng xếp hạng (`Top Trending`).
  4. **CHƯƠNG 3: KẾT LUẬN (Mục 3.1 & 3.2) + TÀI LIỆU THAM KHẢO:**
     - Lập bảng phân công nhiệm vụ và phần trăm đóng góp của 4 thành viên.
     - Đánh giá kết quả đạt được (9/9 yêu cầu bắt buộc + điểm cộng Microservices/Docker), nêu hạn chế và hướng phát triển tương lai.
     - Liệt kê danh mục Tài liệu tham khảo chuẩn theo công nghệ dự án sử dụng.
- **Tài liệu tham khảo sẵn có:**
  - [`Admin.png`](./Admin.png)
  - [`BAO_CAO_TONG_HOP_DO_AN_CUOI_KY.md`](./BAO_CAO_TONG_HOP_DO_AN_CUOI_KY.md)

---

## PHẦN 3: CHECKLIST 32 HÌNH CHỤP GIAO DIỆN & KIẾN TRÚC

Dùng checklist này để cả nhóm đánh dấu tiến độ chụp ảnh và đặt Caption thống nhất:

### Nhóm Kiến trúc & Cơ sở dữ liệu (Chương 2 — Mục 2.1 & 2.2)
- [ ] **TV2** — Sơ đồ ERD Cơ sở dữ liệu PostgreSQL (Supabase) gồm 18+ bảng
- [ ] **TV1** — Sơ đồ kiến trúc 5 Microservices & Docker Compose (`mangahub-net`)
- [ ] **TV1** — Ảnh chụp Eureka Discovery Dashboard (`http://localhost:8761`) hiển thị 4 services `UP`
- [ ] **TV1** — Ảnh chụp `docker compose ps` & Swagger UI (`http://localhost:8080/swagger-ui/index.html`)
- [ ] **TV1** — Cây thư mục Backend 5 Microservices
- [ ] **TV3** — Cây thư mục Frontend Next.js 16 (`app/`, `components/`, `lib/`, `store/`, `types/`)

### Mục 2.3.1 — Xác thực, Email & Thanh toán VNPay (TV1 — 8 hình)
- [ ] Hình 2.3.1.1: Giao diện Đăng nhập (`/login`)
- [ ] Hình 2.3.1.2: Modal chọn tài khoản Google OAuth2
- [ ] Hình 2.3.1.3: Giao diện Đăng ký tài khoản mới (`/register`)
- [ ] Hình 2.3.1.4: Giao diện Quên mật khẩu — Nhập Email (`/forgot-password`)
- [ ] Hình 2.3.1.5: Hòm thư Gmail nhận mã OTP đặt lại mật khẩu / Biên lai nạp Xu
- [ ] Hình 2.3.1.6: Giao diện Nhập mã OTP & Đặt lại mật khẩu mới
- [ ] Hình 2.3.1.7: Giao diện Ví Xu, chọn gói nạp & Hộp thẻ test NCB Sandbox (`/payment`)
- [ ] Hình 2.3.1.8: Cổng thanh toán VNPay Sandbox & Trang kết quả giao dịch thành công (`/payment/result`)

### Mục 2.3.2a — Quản trị Admin Master & Phân quyền (TV4 — 6 hình)
- [ ] Hình 2.3.2.1: Màn hình chặn truy cập `403 Forbidden` khi `ROLE_USER` vào `/admin`
- [ ] Hình 2.3.2.2: Trang Tổng quan Admin Master (`/admin`)
- [ ] Hình 2.3.2.3: Giao diện Quản lý & Kiểm duyệt nội dung / Báo cáo chương lỗi (`/admin/content`)
- [ ] Hình 2.3.2.4: Giao diện Quản lý người dùng, Phân quyền 4 Role & Ban/Mute (`/admin/users`)
- [ ] Hình 2.3.2.5: Giao diện Cấu hình trang chủ & Quản lý thể loại (`/admin/ui-config`)
- [ ] Hình 2.3.2.6: Giao diện Giám sát hạ tầng & Dung lượng Cloudinary (`/admin/infrastructure`)

### Mục 2.3.2b — Kênh Uploader Studio & MangaDex Crawler (TV2 — 7 hình)
- [ ] Hình 2.3.2.7: Trang Tổng quan Uploader Studio (`/uploader`)
- [ ] Hình 2.3.2.8: Giao diện Danh sách truyện của tôi (`/uploader/mangas`)
- [ ] Hình 2.3.2.9: Giao diện Tạo đầu truyện mới (`/uploader/mangas/new`)
- [ ] Hình 2.3.2.10: Giao diện Chỉnh sửa truyện & Tải ảnh bìa Cloudinary (`/uploader/mangas/[id]`)
- [ ] Hình 2.3.2.11: Giao diện Upload chương truyện (ảnh / file `.zip` nén WebP)
- [ ] Hình 2.3.2.12: Giao diện Nhập truyện từ MangaDex (`/uploader/mangadex`)
- [ ] Hình 2.3.2.13: Giao diện Công cụ Crawler tìm kiếm & cào trực tiếp (`/crawler`)

### Mục 2.3.3a — Trang chủ Độc giả (TV4 — 3 hình)
- [ ] Hình 2.3.3.1: Giao diện Trang chủ — Hero Banner, Thanh tìm kiếm & Lọc thể loại (`/`)
- [ ] Hình 2.3.3.2: Giao diện Truyện mới cập nhật (`Recently Updated` — dạng List & Grid)
- [ ] Hình 2.3.3.3: Giao diện Bảng xếp hạng thịnh hành (`Top Trending`)

### Mục 2.3.3b — Đọc truyện & Tương tác Độc giả (TV3 — 8 hình)
- [ ] Hình 2.3.3.4: Giao diện Chi tiết truyện *Yofukashi no Uta* (`/manga/[id]`)
- [ ] Hình 2.3.3.5: Giao diện Đánh giá 1–5 sao & Theo dõi truyện
- [ ] Hình 2.3.3.6: Giao diện Bình luận & Tính năng Ẩn/Hiện Spoiler
- [ ] Hình 2.3.3.7: Giao diện Đọc chương truyện Full 40 trang qua Image Proxy (`/chapter/[chapterId]`)
- [ ] Hình 2.3.3.8: Giao diện Modal Cài đặt chế độ đọc (`SettingsModal`)
- [ ] Hình 2.3.3.9: Giao diện Tủ sách cá nhân (`/library`)
- [ ] Hình 2.3.3.10: Giao diện Lịch sử đọc & Tiếp tục đọc dở (`/history`)
- [ ] Hình 2.3.3.11: Giao diện Hộp thông báo chương mới (`/notifications`)

---

## PHẦN 4: QUY CHUẨN ĐỊNH DẠNG WORD & QUY TRÌNH GHÉP FILE

Để khi 4 thành viên gửi bài về ghép vào [`Mau_BaoCaoDoAnJava_MinieShop.docx`](../Mau_BaoCaoDoAnJava_MinieShop.docx) không bị lệch định dạng, cả nhóm thống nhất 4 quy tắc:

1. **Font & Cỡ chữ chuẩn mẫu:** `Times New Roman`, cỡ `13pt`, giãn dòng `1.3` – `1.5`, căn đều 2 bên (`Justify`), sử dụng đúng Style `Heading 1`, `Heading 2`, `Heading 3` của file mẫu để tự động sinh Mục lục.
2. **Đặt chú thích hình bằng Insert Caption (không tự gõ tay):** Dùng `References → Insert Caption` theo mẫu *Hình X: Giao diện ...* (in nghiêng, căn giữa dưới ảnh) để bước cuối tự động sinh trang **Danh mục các hình vẽ, đồ thị**.
3. **Chuẩn chụp ảnh màn hình:** Chụp ở tỷ lệ trình duyệt `100%` (độ phân giải `1440×900` hoặc `1920×1080`), tắt thanh Bookmarks của Chrome để giao diện Dark Mode của MangaHub lên báo cáo sắc nét và đồng nhất.
4. **Quy trình ghép bài & xuất bản:**
   - Tạo 1 file Google Docs / Word Online dùng chung từ khung mẫu (hoặc 4 thành viên viết trên 4 file `.docx` riêng theo đúng phần được giao).
   - Nộp về cho **Thành viên 1 (`Quy`)** ghép thành bản hoàn chỉnh.
   - Bấm chuột phải vào **Mục lục** & **Danh mục hình vẽ** → `Update Field` → `Update entire table`.
   - Kiểm tra ngắt trang (không để tiêu đề mục nằm lẻ cuối trang) và xuất file `.pdf` nộp giảng viên.

