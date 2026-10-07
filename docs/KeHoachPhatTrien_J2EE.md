# Kế hoạch Phát triển Dự án Manga (Môn J2EE)

## Yêu cầu môn học
Do đây là dự án môn tìm hiểu công nghệ **J2EE (Java Spring Boot)**, yêu cầu cốt lõi là **TẤT CẢ 4 THÀNH VIÊN đều phải tham gia viết Backend**. 

Thay vì chia nhóm theo lớp Frontend/Backend (Horizontal), nhóm sẽ chia theo **Từng cụm tính năng (Vertical Slices / Feature-based)**. Mỗi thành viên sẽ chịu trách nhiệm phát triển một luồng (Flow) từ dưới lên trên (Từ Database -> J2EE Backend -> REST API -> Next.js Frontend).

---

## 👥 Phân công nhiệm vụ chi tiết

### 👨‍💻 Thành viên 1: Nền tảng Xác thực & Bảo mật (Core Auth Flow)
*Chịu trách nhiệm bảo vệ hệ thống và định danh người dùng.*
- **Backend (J2EE / Spring Boot):**
  - Thiết lập thư viện và cấu trúc dự án.
  - Tích hợp **Spring Security** và cấu hình bộ lọc **JWT (JSON Web Token)**.
  - Định nghĩa Roles (ADMIN, MOD, UPLOADER, USER).
  - Viết các API: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.
- **Frontend (Next.js):**
  - Thiết lập Axios Interceptor để tự động gắn JWT Token vào Header.
  - Cấu hình Global State (Zustand/Context API) quản lý phiên đăng nhập.
  - Xây dựng giao diện Đăng nhập / Đăng ký.

### 👨‍💻 Thành viên 2: Luồng Nhóm Dịch, Cào Dữ Liệu & Lưu trữ ảnh (Uploader Flow & MangaDex Crawler)
*Chịu trách nhiệm quản lý nội dung nguồn, xử lý file ảnh nội bộ và cào dữ liệu từ nguồn ngoài.*
- **Backend (J2EE / Spring Boot):**
  - Viết API CRUD Truyện (Manga) và Chương truyện (Chapter) dành cho Uploader (Nguồn LOCAL).
  - Tích hợp dịch vụ **Cloud Storage (AWS S3 / Cloudinary / Local)** để xử lý file `.ZIP` và nén ảnh (Convert to WebP).
  - **Tích hợp MangaDex API:** Dùng `RestTemplate` hoặc `WebClient` để gọi API MangaDex, lấy siêu dữ liệu (Metadata: Tên truyện, Tác giả, Thể loại, Chương...) và đồng bộ/map về Database của hệ thống.
- **Frontend (Next.js):**
  - Xây dựng Layout riêng cho Uploader Dashboard.
  - Xây dựng công cụ Upload ảnh chương nội bộ (Kéo thả Drag & Drop).
  - Dựng form cho phép Uploader dán link MangaDex để hệ thống tự động cào thông tin thay vì nhập tay.

### 👨‍💻 Thành viên 3: Trải nghiệm Độc giả & Tương tác (User Interaction Flow)
*Chịu trách nhiệm giữ chân người dùng thông qua trải nghiệm đọc và tương tác.*
- **Backend (J2EE / Spring Boot):**
  - Viết API lưu và cập nhật **Tiến độ đọc (UC09)** (Lưu vị trí chương/trang, tính % hoàn thành).
  - Viết API **Theo dõi truyện (UC08)** (Bookmark) và hệ thống sinh Thông báo (Notification) khi có chương mới.
  - Viết API quản lý Bình luận (có cờ Spoiler) và API Đánh giá Rating (1-5 sao).
- **Frontend (Next.js):**
  - Hoàn thiện logic tải ảnh trang truyện trong Reader Canvas, tự động báo API lưu tiến độ đọc (Debounce scroll).
  - Làm UI bảng Tủ sách cá nhân (Bookmark) và Lịch sử đọc.
  - Ghép API cho phần Bình luận và Đánh giá (Rating Star) dưới mỗi truyện.

### 👨‍💻 Thành viên 4: Tìm kiếm, Nguồn Hỗn Hợp, Trang chủ & Quản trị (Search, Mixed Source & Admin Flow)
*Chịu trách nhiệm điều phối nội dung trang chủ, xử lý tìm kiếm đa nguồn và công cụ kiểm duyệt.*
- **Backend (J2EE / Spring Boot):**
  - Viết API Query động (JPA Specification) để Tìm kiếm và Lọc truyện nội bộ theo nhiều Thẻ (Toán tử AND).
  - **Trộn dữ liệu (Mixed Source):** Khi tìm kiếm, gọi đồng thời API nội bộ và API MangaDex (dựa trên source lọc), kết hợp (merge) danh sách, xử lý phân trang (pagination) và trả về list truyện thống nhất.
  - Viết API cấp dữ liệu cho Trang chủ (`HomeShowcase`).
  - Viết API cho Admin: Ẩn mềm (Mod), Xóa cứng, Khóa (Ban) và Cấm chat (Mute).
- **Frontend (Next.js):**
  - Dựng và ghép dữ liệu Layout Trang chủ (Banners, Danh sách truyện đề xuất).
  - Làm trang Tìm kiếm / Filter truyện (Có tuỳ chọn Lọc theo nguồn: Local hoặc MangaDex).
  - Xây dựng Layout Admin Dashboard và các Bảng quản lý/xử lý vi phạm.

---

## 🚀 Kế hoạch Giai đoạn 1 (Làm ngay tuần này)
Để mọi người có thể bắt đầu code Backend ngay, đây là mục tiêu của Giai đoạn 1:
1. **Thành viên 1:** Setup Spring Security, ra được Token đăng nhập hợp lệ.
2. **Thành viên 2:** Viết xong Entity/Repository cho Truyện & Chương. Thử nghiệm kết nối S3/Cloudinary upload được 1 file ảnh qua API.
3. **Thành viên 3:** Viết API Trả về danh sách Chapter Pages tĩnh (Chưa cần auth) để Frontend Reader có thể chạy. Viết khung API POST cho Comment.
4. **Thành viên 4:** Viết API `GET /api/mangas` hỗ trợ phân trang (Pagination) và Search cơ bản bằng chữ.

*Theo mô hình này, tất cả mọi người đều được trực tiếp code Java (Controllers, Services, Repositories, Entities) để hoàn thành đồ án đúng tiêu chí môn J2EE.*
