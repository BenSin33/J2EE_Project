# Bookmark và Tủ sách

## Chuẩn bị database hiện có

Chạy nội dung Database/migrations/001_bookmark_notifications.sql trong Supabase SQL Editor của database nhóm trước khi dùng các API Bookmark với tài khoản đã đăng nhập. Đây là migration bổ sung một cột notifications_enabled, không xóa bookmark hoặc lịch sử. Đã tạo file, chưa chạy vào database nhóm trong phiên này.

Database/project_database_v2.sql là bản schema tham chiếu có cảnh báo không chạy toàn bộ. Đã cập nhật cột mới trong bản tham chiếu; với database đang có chỉ dùng migration. Cần bảng bookmarks và ràng buộc unique_user_bookmark(user_id,manga_id) như schema hiện tại.

## API

Tất cả route nằm trong /api/v1/me/bookmarks, yêu cầu Spring Security xác thực. Principal name là UUID nội bộ users.id như UC09; tài khoản ban bị từ chối. Không nhận userId trong body hoặc query để chọn chủ sở hữu.

| Method | Route | Chức năng |
| --- | --- | --- |
| GET | /api/v1/me/bookmarks?page=0&size=20&folderType=reading | Danh sách của chủ tài khoản, filter tùy chọn |
| GET | /api/v1/me/bookmarks/{mangaId} | Bookmark hoặc response rỗng nếu chưa theo dõi |
| PUT | /api/v1/me/bookmarks/{mangaId} | Theo dõi, không cần body |
| PATCH | /api/v1/me/bookmarks/{mangaId} | Sửa trạng thái đọc hoặc cờ thông báo |
| DELETE | /api/v1/me/bookmarks/{mangaId} | Bỏ theo dõi; 204 kể cả đã bỏ |

PATCH ví dụ:

```json
{ "folderType": "completed" }
```

hoặc:

```json
{ "notificationsEnabled": true }
```

Có thể gửi cả hai trường. Trường không gửi giữ nguyên giá trị; body rỗng hoặc folderType ngoài danh sách bị từ chối. Thay folder không sửa cờ thông báo; bỏ theo dõi không xóa reading_history.

Trạng thái theo CHECK hiện tại: reading, plan_to_read, completed, re_reading, dropped. Theo dõi mới mặc định reading và thông báo tắt (false) để người dùng tự bật; đây là lựa chọn triển khai có thể đổi khi nhóm thống nhất. Gọi PUT lại không reset các tùy chọn; constraint UNIQUE và ON CONFLICT tránh tạo bookmark trùng.

Truyện mới theo dõi phải có approval_status=approved. Truyện đã theo dõi nhưng bị ẩn vẫn nằm trong Tủ sách, hiển thị Không còn khả dụng; người dùng vẫn có thể cập nhật trạng thái hoặc bỏ theo dõi.

## Frontend

Mở http://localhost:3000/library. Có lọc trạng thái, phân trang, ảnh bìa, tùy chọn thông báo, đổi trạng thái và bỏ theo dõi. Nút Tủ sách đã nối ở menu trang chủ và Navbar chung.

Trang /manga/{id} có nút Theo dõi/Tủ sách. id phải là UUID nội bộ thực trong database. Trang chi tiết hiện vẫn có metadata mock từ dự án cũ; ID demo không tương ứng bản ghi database nên chưa dùng được để theo dõi thật. Không tự tạo truyện giả hoặc lưu bookmark giả. Trang động đã sửa sang await params theo Next.js 16.

Frontend gửi credentials: include qua readerAccountRequest chung với UC09. Nếu nhóm chọn JWT, thành viên 1 cần nối token/interceptor vào hàm này. Hiện chưa có luồng login thật, nên Guest thấy yêu cầu đăng nhập. Không bypass xác thực để thử UI. Sau khi đăng nhập, reload Tủ sách hoặc bấm Thử lại trạng thái ở trang truyện.

Mọi thao tác đợi response thành công trước khi đổi UI, disable nút khi đang cập nhật; lỗi hiển thị và cho thử lại. Bộ lọc reset về trang đầu; xóa bản ghi cuối trang chuyển về trang trước.

## Nghiệm thu sau khi auth được nối

1. Đăng nhập A, theo dõi truyện công khai tồn tại: xuất hiện trong /library.
2. Gọi PUT lặp lại: chỉ một dòng, giữ folder/cờ thông báo.
3. Bật thông báo rồi chuyển Đã đọc: cờ vẫn bật.
4. Tắt thông báo: folder vẫn Đã đọc.
5. Bỏ theo dõi: khỏi Tủ sách, lịch sử đọc vẫn còn.
6. Đăng nhập B: không thấy/sửa/xóa bookmark A.
7. Ban tài khoản: API từ chối; Guest nhận 401.
8. Ẩn truyện đã theo dõi: giữ bookmark, không cung cấp liên kết công khai.

Phần này chỉ quản lý cờ nhận thông báo, chưa sinh Notification khi xuất bản chương LOCAL. Cần phối hợp thành viên 2 để làm sự kiện xuất bản đầu và chống thông báo trùng ở bước sau.

## Kiểm tra đã thực hiện

Backend compile và 16 test (8 Bookmark, 8 UC09/demo) pass. Next.js typegen, TypeScript và lint phần mới pass; Navbar trang chủ còn một cảnh báo img sẵn có. API Bookmark đang chạy trả 401 cho Guest với CORS đúng. Chưa ghi/đọc Bookmark bằng tài khoản thật trong database nhóm vì luồng xác thực chưa được nối và migration chưa được chạy.
