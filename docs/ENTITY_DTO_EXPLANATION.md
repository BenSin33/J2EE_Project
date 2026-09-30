# CẨM NANG TOÀN DIỆN: GIẢI THÍCH CHI TIẾT ENTITY VÀ DTO TRONG DỰ ÁN MANGAHUB

Tài liệu này cung cấp cái nhìn chi tiết và chuyên sâu về **từng Entity** và **từng DTO** trong hệ thống `manga-backend-services`, phân tích vai trò, cách thức hoạt động, luồng tương tác thực tế giữa chúng, và kế hoạch phục vụ các tính năng tương lai của website đọc truyện MangaHub.

---

# PHẦN I: GIẢI THÍCH CHI TIẾT TOÀN BỘ CÁC ENTITY (CSDL)

Entity là đại diện trực tiếp cho các bảng trong PostgreSQL (Supabase). Chúng chịu trách nhiệm lưu trữ và duy trì tính toàn vẹn dữ liệu.

---

### 1. `User` (Bảng `users`)
* **Các trường dữ liệu:** `id` (UUID), `username`, `email`, `passwordHash`, `avatarUrl`, `role` (ROLE_USER, ROLE_ADMIN, ROLE_SCANLATOR), `isBanned`, `isMuted`, `createdAt`, `updatedAt`.
* **Mục đích:** Lưu trữ thông tin định danh và tài khoản người dùng, phân quyền truy cập hệ thống.
* **Nghiệp vụ thực tế:** Xác thực người dùng (JWT Authentication), chặn tài khoản vi phạm (`isBanned`), cấm chat/bình luận (`isMuted`).

---

### 2. `UserSetting` (Bảng `user_settings`)
* **Các trường dữ liệu:** `userId` (PK, FK tới `users.id`), `readerTheme` (dark, light, sepia), `readingMode` (vertical - cuộn dọc dạng webtoon, horizontal - lật trang manga), `fitMode` (fit-width, fit-height), `fontSize`.
* **Mục đích:** Lưu trữ cấu hình trình đọc (Reader Canvas) được cá nhân hóa theo từng tài khoản.
* **Nghiệp vụ thực tế:** Khi người dùng đổi từ giao diện tối sang sáng hoặc chỉnh chế độ đọc webtoon, cài đặt này được đồng bộ để khi chuyển máy/trình duyệt khác vẫn giữ nguyên trải nghiệm.

---

### 3. `ScanlationGroup` (Bảng `scanlation_groups`)
* **Các trường dữ liệu:** `id`, `mangadexId` (UUID trên MangaDex nếu cào về), `name`, `description`, `leaderId`, `website`, `discord`, `donationLink`, `createdAt`.
* **Mục đích:** Quản lý các nhóm dịch truyện (Scanlation Teams).
* **Nghiệp vụ thực tế:** Ghi nhận công sức nhóm dịch, liên kết đến các kênh ủng hộ (Patreon/Momo) và Discord của nhóm dịch đó.

---

### 4. `Author` (Bảng `authors`)
* **Các trường dữ liệu:** `id`, `mangadexId`, `name`, `biography`.
* **Mục đích:** Lưu trữ hồ sơ các tác giả, họa sĩ truyện tranh.
* **Nghiệp vụ thực tế:** Cho phép người đọc click vào tên tác giả để xem toàn bộ danh sách các tác phẩm khác của cùng tác giả đó.

---

### 5. `Tag` (Bảng `tags`)
* **Các trường dữ liệu:** `id`, `mangadexId`, `name`, `groupType` (genre, theme, format, content).
* **Mục đích:** Lưu trữ danh sách thể loại và nhãn phân loại của truyện (Action, Romance, Isekai, One-shot...).
* **Nghiệp vụ thực tế:** Phục vụ bộ lọc tìm kiếm nâng cao (Search & Filter) trên Frontend.

---

### 6. `Manga` (Bảng `mangas`)
* **Các trường dữ liệu:** `id`, `mangadexId`, `uploaderId`, `title`, `altTitles` (JSONB), `description`, `coverImageUrl`, `originalLanguage`, `originType`, `status`, `contentRating`, `viewsCount`, `bookmarksCount`, `ratingScore`, `ratingCount`, `approvalStatus`, `rejectionReason`, `createdAt`, `updatedAt`.
* **Mục đích:** Thực thể cốt lõi nhất của hệ thống, lưu trữ toàn bộ hồ sơ một bộ truyện tranh (lưu ý: nhóm dịch `groupId` gắn ở cấp chương `Chapter` thay vì gắn cứng vào cả bộ truyện).
* **Nghiệp vụ thực tế:** Trang chi tiết truyện (`/manga/[id]`), trang chủ (Top Trending, Recently Updated), hiển thị ảnh bìa, tóm tắt và điểm đánh giá.

---

### 7. `MangaAuthor` & `MangaAuthorId` (Bảng `manga_authors`)
* **Các trường dữ liệu:** `mangaId`, `authorId`, `role` (author, artist). Khóa chính phức hợp 3 cột.
* **Mục đích:** Bảng nối nhiều - nhiều giữa `mangas` và `authors`.
* **Nghiệp vụ thực tế:** Một bộ truyện có thể có tác giả cốt truyện (Story) khác với họa sĩ minh họa (Art) (ví dụ: One-Punch Man do ONE viết kịch bản và Murata Yusuke vẽ tranh).

---

### 8. `MangaTag` & `MangaTagId` (Bảng `manga_tags`)
* **Các trường dữ liệu:** `mangaId`, `tagId`. Khóa chính phức hợp 2 cột.
* **Mục đích:** Bảng nối nhiều - nhiều giữa `mangas` và `tags`.
* **Nghiệp vụ thực tế:** Gắn nhiều thể loại cho 1 bộ truyện.

---

### 9. `Chapter` (Bảng `chapters`)
* **Các trường dữ liệu:** `id`, `mangadexId`, `mangaId`, `uploaderId`, `groupId`, `volume`, `chapterNumber` (String), `title`, `translatedLanguage`, `storageType`, `mangadexHash`, `pinnedComment`, `status`, `publishAt`, `createdAt`.
* **Mục đích:** Đại diện cho từng chương truyện của một bộ manga.
* **Nghiệp vụ thực tế:** Danh sách chương trên trang chi tiết truyện, lưu số chương, thời gian xuất bản và mã hash của MangaDex để tải ảnh qua mạng MangaDex@Home.

---

### 10. `ChapterPage` (Bảng `chapter_pages`)
* **Các trường dữ liệu:** `id`, `chapterId`, `pageNumber`, `imageFileName`, `dataSaverFileName`, `s3OriginUrl`, `s3WebpUrl`, `width`, `height`, `createdAt`. Ràng buộc duy nhất `(chapter_id, page_number)`.
* **Mục đích:** Lưu trữ thông tin từng trang ảnh trong chương đọc truyện.
* **Nghiệp vụ thực tế:** Cung cấp danh sách URL ảnh cho Reader Canvas hiển thị lần lượt từ trang 1 đến trang cuối cùng.

---

### 11. `ReadingHistory` (Bảng `reading_history`)
* **Các trường dữ liệu:** `id`, `userId`, `mangaId`, `lastChapterId`, `lastPage`, `readAt`. Ràng buộc duy nhất `(user_id, manga_id)`.
* **Mục đích:** Theo dõi tiến độ đọc của người dùng.
* **Nghiệp vụ thực tế:** Khi người dùng quay lại đọc truyện, hệ thống có nút "Đọc tiếp" tự động nhảy tới đúng chương và đúng số trang họ đã dừng lại lần trước.

---

### 12. `Bookmark` (Bảng `bookmarks`)
* **Các trường dữ liệu:** `id`, `userId`, `mangaId`, `folderType` (reading, plan_to_read, completed, re_reading, dropped), `createdAt`. Ràng buộc duy nhất `(user_id, manga_id)`.
* **Mục đích:** Quản lý tủ truyện cá nhân (Library).
* **Nghiệp vụ thực tế:** Phân loại truyện yêu thích, nhận thông báo khi có chương mới ra mắt.

---

### 13. `MangaRating` (Bảng `manga_ratings`)
* **Các trường dữ liệu:** `id`, `userId`, `mangaId`, `ratingStar` (1 đến 5), `createdAt`. Ràng buộc duy nhất `(user_id, manga_id)`.
* **Mục đích:** Lưu trữ đánh giá của người dùng.
* **Nghiệp vụ thực tế:** Một người chỉ được chấm điểm 1 lần cho 1 truyện; hệ thống dùng bảng này để tự động tính lại điểm trung bình `ratingScore` trong bảng `mangas`.

---

### 14. `Comment` (Bảng `comments`)
* **Các trường dữ liệu:** `id`, `userId`, `mangaId`, `chapterId`, `parentId`, `content`, `isSpoiler`, `isHidden`, `createdAt`.
* **Mục đích:** Bình luận thảo luận dưới mỗi bộ truyện hoặc từng chương cụ thể.
* **Nghiệp vụ thực tế:** Cho phép người đọc đàm đạo, hỗ trợ reply lồng nhau nhiều cấp thông qua `parentId`, ẩn nội dung tiết lộ tình tiết (`isSpoiler`).

---

### 15. `ChapterReport` (Bảng `chapter_reports`)
* **Các trường dữ liệu:** `id`, `chapterId`, `userId`, `reportType`, `description`, `status` (pending, resolved, rejected), `createdAt`.
* **Mục đích:** Báo cáo lỗi kỹ thuật của chương truyện (ảnh chết link, sai thứ tự trang, dịch lỗi).
* **Nghiệp vụ thực tế:** Đưa vào trang Admin Dashboard để quản trị viên kiểm tra và sửa lỗi chương truyện.

---

### 16. `HomeShowcase` (Bảng `home_showcases`)
* **Các trường dữ liệu:** `id`, `mangaId`, `displaySection` (hero, trending, spotlight), `bannerCustomUrl`, `sortOrder`, `isActive`, `createdBy`.
* **Mục đích:** Quản lý danh sách banner truyện nổi bật xuất hiện tại trang chủ.
* **Nghiệp vụ thực tế:** Cho phép Admin tùy ý đặt bộ truyện nào lên slide Hero banner đầu trang web mà không cần sửa code.

---

# PHẦN II: GIẢI THÍCH CHI TIẾT TOÀN BỘ CÁC DTO & KẾ HOẠCH TƯƠNG LAI

DTO (Data Transfer Object) là cầu nối giữa thế giới bên ngoài và hệ thống Backend. Dưới đây là phân tích chi tiết từng DTO, cách chúng tương tác với Entity và kế hoạch sử dụng trong tương lai.

---

## 1. Nhóm DTO Request (`dto/request/*`) - Nhận dữ liệu từ Client

### `LoginRequest`
* **Các trường:** `usernameOrEmail`, `password` (kèm `@NotBlank`).
* **Hoạt động với Entity:** Service nhận `LoginRequest`, tìm trong bảng `User` bằng `username` hoặc `email`. Sau đó dùng `PasswordEncoder` so khớp mật khẩu truyền lên với `passwordHash` của Entity `User`.
* **Kế hoạch tương lai:** Phục vụ chức năng xác thực người dùng (Spring Security + JWT), trả về Access Token và Refresh Token.

### `RegisterRequest`
* **Các trường:** `username`, `email`, `password` (kèm `@NotBlank`, `@Email`, `@Size(min=6)`).
* **Hoạt động với Entity:** Service kiểm tra xem `username` hoặc `email` đã tồn tại trong `User` chưa. Nếu chưa, mã hóa password thành BCrypt hash, tạo mới một Entity `User` và lưu vào Database.
* **Kế hoạch tương lai:** Đăng ký tài khoản mới, gửi email kích hoạt tài khoản.

### `UpdateUserRequest`
* **Các trường:** `username`, `avatarUrl`.
* **Hoạt động với Entity:** Lấy `User` hiện tại từ Security Context, cập nhật các trường được phép thay đổi, rồi lưu ngược lại vào Database.
* **Kế hoạch tương lai:** Phục vụ trang hồ sơ cá nhân (`/profile`), cho phép người dùng đổi ảnh đại diện và nickname.

### `UpdateUserSettingsRequest`
* **Các trường:** `readerTheme`, `readingMode`, `fitMode`, `fontSize`.
* **Hoạt động với Entity:** Tìm hoặc khởi tạo `UserSetting` tương ứng với `userId`, cập nhật các mode rồi lưu lại.
* **Kế hoạch tương lai:** Tích hợp trực tiếp trên thanh điều khiển của trình đọc truyện (`ReaderCanvas`), người dùng đổi màu nền hoặc đổi kiểu lật trang thì lập tức tự động lưu lại vào CSDL.

### `CreateMangaRequest` & `UpdateMangaRequest`
* **Các trường:** `title`, `altTitles`, `description`, `coverImageUrl`, `originalLanguage`, `originType`, `status`, `contentRating`, `authorIds`, `tagIds`...
* **Hoạt động với Entity:**
  1. Service chuyển đổi Request thành Entity `Manga` và lưu lại để lấy `manga.id`.
  2. Duyệt qua `authorIds` để tạo các bản ghi `MangaAuthor`.
  3. Duyệt qua `tagIds` để tạo các bản ghi `MangaTag`.
* **Kế hoạch tương lai:** Phục vụ trang Upload truyện dành cho Nhóm dịch (Scanlator) và trang quản trị Admin thêm truyện thủ công.

### `CreateChapterRequest`
* **Các trường:** `mangaId`, `volume`, `chapterNumber`, `title`, `translatedLanguage`, `storageType`, `mangadexHash`, `pinnedComment`.
* **Hoạt động với Entity:** Kiểm tra `mangaId` có hợp lệ không, sau đó khởi tạo Entity `Chapter` với trạng thái `published` và lưu vào CSDL.
* **Kế hoạch tương lai:** Đăng tải chapter mới cho truyện hoặc nhận dữ liệu sau khi cào một chapter từ MangaDex.

### `CreateBookmarkRequest`
* **Các trường:** `mangaId`, `folderType` (reading, completed, plan_to_read...).
* **Hoạt động với Entity:** Dùng cơ chế "Upsert" (nếu đã có `Bookmark` với cặp `userId` - `mangaId` thì cập nhật `folderType`, nếu chưa thì tạo mới). Đồng thời tăng/giảm `bookmarksCount` trên Entity `Manga`.
* **Kế hoạch tương lai:** Nút bấm "Yêu thích / Theo dõi truyện" trên giao diện chi tiết truyện (`/manga/[id]`).

### `UpdateReadingHistoryRequest`
* **Các trường:** `mangaId`, `lastChapterId`, `lastPage`.
* **Hoạt động với Entity:** Khi người dùng đang đọc ở trang web, Frontend sẽ gửi request ngầm (Debounce) tới API. Service sẽ cập nhật `lastChapterId`, `lastPage` và thời gian `readAt` trong Entity `ReadingHistory`.
* **Kế hoạch tương lai:** Tự động lưu tiến độ đọc theo thời gian thực (Real-time progress saving) khi người dùng cuộn chuột qua từng trang truyện.

### `CreateRatingRequest`
* **Các trường:** `mangaId`, `ratingStar` (1 đến 5).
* **Hoạt động với Entity:** Lưu/Cập nhật vào `MangaRating`. Sau đó Service gọi câu lệnh tính toán trung bình cộng số sao của bộ truyện này và cập nhật lại `ratingScore` và `ratingCount` trên Entity `Manga`.
* **Kế hoạch tương lai:** Component đánh giá sao 5 sao ở trang chi tiết truyện.

### `CreateCommentRequest`
* **Các trường:** `mangaId`, `chapterId`, `parentId`, `content`, `isSpoiler`.
* **Hoạt động với Entity:** Chuyển thành Entity `Comment`, gắn `userId` của người đang đăng nhập và lưu vào CSDL.
* **Kế hoạch tương lai:** Hệ thống thảo luận cộng đồng dưới mỗi chương và dưới trang thông tin truyện.

### `CreateChapterReportRequest`
* **Các trường:** `chapterId`, `reportType`, `description`.
* **Hoạt động với Entity:** Tạo mới bản ghi `ChapterReport` với trạng thái mặc định là `pending`.
* **Kế hoạch tương lai:** Nút "Báo lỗi chương" trong menu trình đọc (ảnh hỏng, trùng chương...).

---

## 2. Nhóm DTO Response (`dto/response/*`) - Trả dữ liệu về Client

### `UserResponse`
* **Các trường:** `id`, `username`, `email`, `avatarUrl`, `role`, `isBanned`, `createdAt`...
* **Hoạt động với Entity:** Map từ Entity `User` sang, **loại bỏ hoàn toàn `passwordHash`**.
* **Kế hoạch tương lai:** Trả về thông tin phiên đăng nhập cho Frontend lưu vào Auth State/Context.

### `UserSettingsResponse`
* **Các trường:** `readerTheme`, `readingMode`, `fitMode`, `fontSize`.
* **Hoạt động với Entity:** Map trực tiếp từ `UserSetting`.
* **Kế hoạch tương lai:** Khi mở trang đọc truyện, Frontend gọi API lấy DTO này để thiết lập cấu hình màu nền và chế độ cuộn trang đúng ý người dùng.

### `MangaResponse`
* **Các trường:** Toàn bộ thông tin truyện + danh sách `AuthorResponse` + danh sách `TagResponse`.
* **Hoạt động với Entity:** Service truy vấn Entity `Manga`, sau đó join với các bảng `manga_authors` và `manga_tags` để đính kèm đầy đủ thông tin vào một DTO duy nhất (nhóm dịch được đính kèm ở `ChapterResponse`).
* **Kế hoạch tương lai:** Dùng cho toàn bộ giao diện: Trang chủ (Top Trending, Recently Updated), Trang tìm kiếm truyện, Trang chi tiết bộ truyện.

### `ChapterResponse`
* **Các trường:** Thông tin chương + danh sách `ChapterPageResponse`.
* **Hoạt động với Entity:** Map từ `Chapter` và lấy kèm danh sách các trang ảnh từ `ChapterPage`.
* **Kế hoạch tương lai:** Phục vụ danh sách chương ở trang chi tiết truyện và cung cấp thông tin chương đang đọc.

### `ChapterPageResponse`
* **Các trường:** `pageNumber`, `imageFileName`, `dataSaverFileName`, `s3WebpUrl`, `width`, `height`.
* **Hoạt động với Entity:** Map từ Entity `ChapterPage`.
* **Kế hoạch tương lai:** Cung cấp mảng URL hình ảnh cho component `ReaderCanvas.tsx` để render từng bức ảnh cho người đọc.

### `ReadingHistoryResponse`
* **Các trường:** Thông tin tiến độ đọc + lồng sẵn `MangaResponse` và `ChapterResponse`.
* **Hoạt động với Entity:** Join `ReadingHistory` với `Manga` và `Chapter` tương ứng.
* **Kế hoạch tương lai:** Trang "Lịch sử đọc truyện" của người dùng, hiển thị bìa truyện, tên chương và nút "Đọc tiếp trang X".

### `BookmarkResponse`
* **Các trường:** `id`, `folderType`, `createdAt` + lồng sẵn `MangaResponse`.
* **Hoạt động với Entity:** Join `Bookmark` với `Manga`.
* **Kế hoạch tương lai:** Trang "Tủ truyện yêu thích" (chia tab: Đang đọc, Đã đọc xong, Dự định đọc...).

### `CommentResponse`
* **Các trường:** Thông tin bình luận + `UserResponse` người viết + cây đệ quy `List<CommentResponse> replies`.
* **Hoạt động với Entity:** Service lấy danh sách Entity `Comment`, sau đó gom các bình luận có `parentId` vào danh sách `replies` của bình luận cha.
* **Kế hoạch tương lai:** Hiển thị cây bình luận thảo luận đa cấp như Facebook/Reddit.

### `HomeShowcaseResponse`
* **Các trường:** `displaySection`, `bannerCustomUrl`, `sortOrder` + lồng sẵn `MangaResponse`.
* **Hoạt động với Entity:** Map từ `HomeShowcase` sang, kèm thông tin truyện từ `Manga`.
* **Kế hoạch tương lai:** Cung cấp danh sách slide cho Component `Hero.tsx` ở trang chủ.

---

## 3. Nhóm DTO MangaDex (`dto/mangadex/*`) - Đồng bộ dữ liệu bên ngoài

* **`MangaDexResponse<T>`:** Wrapper chuẩn nhận mọi payload từ MangaDex API (`result`, `limit`, `offset`, `total`, `data`).
* **`MangaDexEntityDto<T>`:** Đại diện cho 1 Object của MangaDex gồm `id`, `type`, `attributes` và mảng `relationships`.
* **`MangaAttributesDto` & `CoverAttributesDto`:** Bóc tách tiêu đề đa ngôn ngữ, tóm tắt nội dung, tên file ảnh bìa từ MangaDex.
* **Cách hoạt động với Entity:**
  ```
  MangaDex API JSON
         │
         ▼
  MangaDexResponse<MangaAttributesDto> (DTO)
         │  (Trích xuất dữ liệu, lấy title tiếng Việt/Anh, lấy link cover art)
         ▼
  Manga (Entity) & Chapter (Entity)
         │  (Lưu vào Database Supabase qua Repository)
         ▼
  PostgreSQL Database
  ```
* **Kế hoạch tương lai:** Phục vụ `MangaDexSyncService` chạy định kỳ (Scheduled Cronjob) hoặc nhận lệnh cào truyện từ Admin để liên tục cập nhật các chương truyện mới nhất từ MangaDex về kho CSDL riêng của MangaHub mà không cần gõ tay.

---

# TỔNG KẾT MỐI QUAN HỆ KIẾN TRÚC

```
                  ┌────────────────────────────────────────┐
                  │           CLIENT (NEXT.JS)             │
                  └──────────────────┬─────────────────────┘
                                     │
                     HTTP Request    │    HTTP Response
                   (JSON RequestDTO) │  (JSON ResponseDTO)
                                     ▼
                  ┌────────────────────────────────────────┐
                  │            CONTROLLER LAYER            │
                  └──────────────────┬─────────────────────┘
                                     │
                  ┌──────────────────┴─────────────────────┐
                  │             SERVICE LAYER              │
                  │  ────────────────────────────────────  │
                  │  • Validate & Process Business Rules   │
                  │  • Map: RequestDTO  ──► Entity         │
                  │  • Map: Entity      ──► ResponseDTO    │
                  │  • Fetch MangaDex   ──► MangaDexDTO    │
                  └──────────────────┬─────────────────────┘
                                     │
                               CRUD  │  Operations
                                     ▼
                  ┌────────────────────────────────────────┐
                  │            REPOSITORY LAYER            │
                  │        (Spring Data JPA Entities)      │
                  └──────────────────┬─────────────────────┘
                                     │
                                     ▼
                  ┌────────────────────────────────────────┐
                  │         DATABASE (POSTGRESQL)          │
                  └────────────────────────────────────────┘
```

Sự tách biệt rạch ròi giữa **Entity** (tầng CSDL) và **DTO** (tầng Giao tiếp) giúp hệ thống MangaHub đạt được:
1. **Tính bảo mật:** Không bao giờ để lộ các trường nhạy cảm (`password_hash`).
2. **Khả năng mở rộng:** Khi nâng cấp giao diện Frontend, chỉ cần sửa DTO mà không làm xáo trộn CSDL.
3. **Hiệu năng cao:** Dữ liệu trả về đúng trọng tâm, không bị dư thừa và hoàn toàn sạch sẽ.
