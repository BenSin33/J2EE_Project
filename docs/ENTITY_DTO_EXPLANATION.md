# TÀI LIỆU KIẾN TRÚC: ENTITY VÀ DTO TRONG HỆ THỐNG MANGA-BACKEND-SERVICES

Tài liệu này giải thích chi tiết về khái niệm, vai trò, mối quan hệ và cách thức hoạt động giữa **Entity** và **DTO (Data Transfer Object)** được xây dựng trong dự án Spring Boot.

---

## 1. Tổng quan Kiến trúc Phân tầng (Layered Architecture)

Trong ứng dụng Spring Boot chuẩn công nghiệp, dữ liệu không bao giờ đi trực tiếp từ Cơ sở dữ liệu (Database) ra ngoài Client (Next.js). Thay vào đó, hệ thống tuân theo mô hình phân tầng chặt chẽ:

```
[ Client: Next.js Frontend ]
        │  ▲
        │  │ (1) Gửi RequestDTO / Nhận ResponseDTO qua HTTP JSON
        ▼  │
[ Controller Layer ] (REST API Endpoints)
        │  ▲
        │  │ (2) Chuyển giao DTO
        ▼  │
[ Service Layer ] (Business Logic & Mapping giữa Entity và DTO)
        │  ▲
        │  │ (3) Thao tác với Entity
        ▼  │
[ Repository Layer ] (Spring Data JPA)
        │  ▲
        │  │ (4) SQL Queries / Hibernate ORM
        ▼  │
[ PostgreSQL / Supabase Database ]
```

---

## 2. Entity là gì?

### 2.1. Khái niệm
* **Entity** là các class Java đại diện **trực tiếp 1-1** cho các bảng (tables) trong cơ sở dữ liệu quan hệ (PostgreSQL).
* Mỗi một object Entity tương ứng với một dòng (record) trong bảng.
* Được quản lý bởi **JPA (Java Persistence API)** và **Hibernate (ORM)**.

### 2.2. Vai trò của Entity
1. **Ánh xạ CSDL (Object-Relational Mapping):** Định nghĩa rõ ràng kiểu dữ liệu, khóa chính (`@Id`), khóa ngoại, ràng buộc duy nhất (`@UniqueConstraint`), độ dài chuỗi (`@Column(length = ...)`).
2. **Bảo toàn dữ liệu (Data Integrity):** Giữ dữ liệu thô và cấu trúc lưu trữ chính xác của hệ thống.
3. **Quản lý vòng đời dữ liệu:** Theo dõi trạng thái thêm mới (`@PrePersist`), cập nhật (`@PreUpdate`), xóa.

### 2.3. Tại sao KHÔNG NÊN trả trực tiếp Entity về cho Client?
* **Lỗ hổng bảo mật:** Entity `User` chứa trường `passwordHash`. Nếu trả thẳng Entity ra API, mật khẩu mã hóa có thể bị lộ.
* **Lỗi vòng lặp vô tận (Infinite Recursion):** Khi có quan hệ hai chiều (ví dụ: Manga chứa Chapters, Chapter lại trỏ ngược về Manga), trình chuyển đổi JSON (Jackson) sẽ bị crash `StackOverflowError`.
* **Hiệu năng & Lazy Loading:** Entity có thể kích hoạt các câu truy vấn ngầm (N+1 query) khi Jackson cố đọc các trường được đánh dấu `FetchType.LAZY`.
* **Ràng buộc chặt chẽ (Tight Coupling):** Bất kỳ thay đổi nào trong cấu trúc bảng Database cũng sẽ làm vỡ giao diện Frontend nếu dùng chung Entity.

---

## 3. DTO (Data Transfer Object) là gì?

### 3.1. Khái niệm
* **DTO (Data Transfer Object)** là đối tượng Java thuần túy (POJO) chỉ mang dữ liệu, **không chứa logic nghiệp vụ và không liên kết với CSDL**.
* DTO đóng vai trò như một **"hợp đồng dữ liệu" (Data Contract)** giữa Backend và Client bên ngoài hoặc bên thứ ba.

### 3.2. Phân loại DTO trong dự án
Hệ thống được tách bạch thành 3 nhóm DTO rõ ràng:

#### A. Request DTOs (`dto.request.*`)
* **Nhiệm vụ:** Nhận và đóng gói dữ liệu mà Client (người dùng/trình duyệt) gửi lên máy chủ qua HTTP POST / PUT / PATCH.
* **Đặc điểm:** Tích hợp sẵn bộ thư viện kiểm tra tính hợp lệ dữ liệu (Bean Validation) như `@NotBlank`, `@Email`, `@Size`, `@Min`, `@Max`.
* **Ví dụ:**
  * `RegisterRequest`: Bắt buộc phải có `username`, `email` hợp lệ và `password` từ 6 ký tự trở lên.
  * `CreateCommentRequest`: Bắt buộc phải có `mangaId`, `content` không được để trống.

#### B. Response DTOs (`dto.response.*`)
* **Nhiệm vụ:** Đóng gói dữ liệu từ Service trả về cho Client hiển thị lên giao diện web.
* **Đặc điểm:** 
  * Loại bỏ hoàn toàn các thông tin nhạy cảm (như mật khẩu, token nội bộ).
  * Sử dụng `@JsonInclude(JsonInclude.Include.NON_NULL)` để giấu các trường có giá trị `null`, làm sạch payload JSON và tiết kiệm băng thông mạng.
  * Gom nhóm dữ liệu liên quan để Frontend không phải gọi nhiều API (ví dụ: `MangaResponse` đính kèm sẵn danh sách tác giả `authors` và thể loại `tags`).

#### C. External API DTOs (`dto.mangadex.*`)
* **Nhiệm vụ:** Ánh xạ cấu trúc JSON đặc thù của MangaDex API (`api.mangadex.org`) khi thực hiện cào dữ liệu hoặc đồng bộ truyện.
* **Ví dụ:** `MangaDexResponse<T>`, `MangaAttributesDto`, `CoverAttributesDto`...

---

## 4. Mối quan hệ giữa Entity và DTO

Entity và DTO bổ trợ lẫn nhau, tạo thành chu trình khép kín:

```
[ Client ]
    │
    │ (1) Gửi JSON Payload (VD: Đăng ký tài khoản)
    ▼
[ RegisterRequest (DTO) ]  ──► Kiểm tra hợp lệ: @NotBlank, @Email...
    │
    │ (2) Chuyển dữ liệu vào Service
    ▼
[ Service ]                ──► Hash mật khẩu, gán quyền mặc định "USER"
    │
    │ (3) Chuyển đổi: DTO ──► Entity
    ▼
[ User (Entity) ]          ──► Ánh xạ tới bảng "users"
    │
    │ (4) Lưu vào Database
    ▼
[ PostgreSQL Database ]
    │
    │ (5) Truy vấn dữ liệu sau khi lưu
    ▼
[ User (Entity) ]
    │
    │ (6) Chuyển đổi: Entity ──► DTO (Lược bỏ trường password_hash)
    ▼
[ UserResponse (DTO) ]
    │
    │ (7) Trả JSON an toàn về cho Client
    ▼
[ Client ]
```

---

## 5. Bảng Đối Chiếu Toàn Diện: Database ↔ Entity ↔ DTOs

| Bảng Database (`.sql`) | Entity Class (`entity/`) | Request DTO (`dto/request/`) | Response DTO (`dto/response/`) | Mục đích & Nghiệp vụ phục vụ |
| :--- | :--- | :--- | :--- | :--- |
| `users` | `User` | `RegisterRequest`<br>`LoginRequest`<br>`UpdateUserRequest` | `UserResponse` | Quản lý tài khoản người dùng, phân quyền (USER/ADMIN), cập nhật thông tin cá nhân. |
| `user_settings` | `UserSetting` | `UpdateUserSettingsRequest` | `UserSettingsResponse` | Lưu cấu hình đọc truyện riêng của từng user (theme tối/sáng, đọc cuộn dọc/ngang). |
| `scanlation_groups` | `ScanlationGroup` | *(Admin / Group APIs)* | `ScanlationGroupResponse` | Quản lý các nhóm dịch truyện, link ủng hộ, Discord. |
| `authors` | `Author` | *(Manga sync APIs)* | `AuthorResponse` | Quản lý tác giả, họa sĩ của bộ truyện. |
| `tags` | `Tag` | *(Filter/Tag APIs)* | `TagResponse` | Thể loại truyện (Action, Romance, Isekai...). Phục vụ lọc tìm kiếm. |
| `mangas` | `Manga` | `CreateMangaRequest`<br>`UpdateMangaRequest` | `MangaResponse` | Thông tin trung tâm của bộ truyện (tiêu đề, ảnh bìa, lượt xem, điểm đánh giá). |
| `manga_authors` | `MangaAuthor`<br>`(MangaAuthorId)` | *(Đi kèm trong Manga)* | *(Gộp trong MangaResponse)* | Bảng trung gian nối Manga với Author theo vai trò (tác giả kịch bản hoặc họa sĩ). |
| `manga_tags` | `MangaTag`<br>`(MangaTagId)` | *(Đi kèm trong Manga)* | *(Gộp trong MangaResponse)* | Bảng trung gian nối Manga với Tag (nhiều - nhiều). |
| `chapters` | `Chapter` | `CreateChapterRequest` | `ChapterResponse` | Chương truyện (số chương, tiêu đề, ngôn ngữ dịch, hash MangaDex). |
| `chapter_pages` | `ChapterPage` | *(Sync/Upload APIs)* | `ChapterPageResponse` | Danh sách link ảnh từng trang của một chương để hiển thị trên trình đọc (Reader). |
| `reading_history` | `ReadingHistory` | `UpdateReadingHistoryRequest` | `ReadingHistoryResponse` | Ghi nhớ tiến độ đọc: đang đọc dở chương nào, trang số mấy để đọc tiếp. |
| `bookmarks` | `Bookmark` | `CreateBookmarkRequest` | `BookmarkResponse` | Quản lý tủ sách cá nhân (Đang đọc, Đã đọc xong, Dự định đọc...). |
| `manga_ratings` | `MangaRating` | `CreateRatingRequest` | `MangaRatingResponse` | Người dùng chấm điểm sao (1 - 5 sao). Dùng để tính điểm trung bình truyện. |
| `comments` | `Comment` | `CreateCommentRequest` | `CommentResponse` | Hệ thống bình luận thảo luận truyện và chapter, hỗ trợ gắn cờ spoiler và trả lời lồng nhau. |
| `chapter_reports` | `ChapterReport` | `CreateChapterReportRequest` | `ChapterReportResponse` | Người dùng báo lỗi chương truyện (ảnh bị lỗi, mất trang, sai bản dịch). |
| `home_showcases` | `HomeShowcase` | *(Admin APIs)* | `HomeShowcaseResponse` | Quản lý danh sách banner quảng bá nổi bật hiển thị ở đầu trang chủ. |

---

## 6. Lợi ích Thực tiễn cho Dự án

1. **Bảo mật tuyệt đối (Security):** Mọi dữ liệu nhạy cảm được giữ kín trong Database, Frontend chỉ nhận đúng các trường được phép thấy.
2. **Khả năng mở rộng (Extensibility):** Khi cần thêm tính năng mới (ví dụ: đăng nhập Google OAuth), ta chỉ cần bổ sung `OAuthLoginRequest` mà không cần đụng chạm làm xáo trộn các Entity cốt lõi.
3. **Frontend thân thiện:** Phía Next.js nhận được các Response DTO được định hình gọn gàng, đúng kiểu TypeScript, không có dữ liệu rác hay các trường `null` thừa thãi.
4. **Dễ kiểm thử (Testability):** Có thể viết Unit Test kiểm tra logic chuyển đổi dữ liệu (Mapping) giữa DTO và Entity một cách độc lập mà không cần kết nối tới Database thật.
