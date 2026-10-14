# Thông báo chương mới

## Chuẩn bị

Chạy migration 001_bookmark_notifications.sql trước, rồi Database/migrations/003_chapter_notifications.sql trong Supabase SQL Editor của project nhóm. Chưa tự chạy migration vào database nhóm. Migration 003 đánh dấu các chương đang published là đã xuất bản trước đây, tránh thông báo hàng loạt cho chương cũ.

Sau khi migration thành công, trong terminal backend đã cấu hình datasource:

```powershell
$env:NOTIFICATIONS_WORKER_ENABLED='true'
.\mvnw.cmd spring-boot:run
```

Worker mặc định tắt, chạy mỗi 10 giây khi bật. Có thể chỉnh notifications.worker.delay-ms. Nếu cấu hình biến môi trường sau khi server đang chạy, cần khởi động lại backend.

## Tích hợp với thành viên 2

Chưa có luồng xuất bản chương thật gọi service này trong repository. Thành viên 2 cần inject ChapterNotificationService và gọi enqueueFirstPublication trong cùng transaction xuất bản, sau khi lưu trạng thái và các trang ảnh:

```java
@Transactional
public Chapter publishChapter(...) {
    // Kiểm tra quyền uploader theo nhóm và dữ liệu chương.
    chapter.setStatus("published");
    chapterRepository.saveAndFlush(chapter);
    // Các chapter_pages cũng phải được lưu/flush trước đây.
    chapterNotificationService.enqueueFirstPublication(chapter.getId());
    return chapter;
}
```

Đây là mẫu tích hợp, cần thay chữ ký và repository theo code thành viên 2. Không gọi trong afterCommit: sự kiện phải được lưu cùng transaction với chương. Không reset first_published_at khi sửa, ẩn hoặc khôi phục chương. Field entity này chỉ đọc; service cập nhật bằng SQL.

Schema hiện chưa có source LOCAL riêng: service xác định LOCAL khi cả manga/chapter không có mangadex_id và storage_type không phải mangadex_at_home. Nếu thành viên 2 thêm nguồn khác, cần thống nhất điều kiện nguồn trước khi tích hợp.

Chỉ tạo sự kiện lần đầu cho chương published, truyện approved và có trang ảnh. Snapshot người theo dõi có notifications_enabled=true tại thời điểm xuất bản. Worker kiểm tra lại bookmark và cờ khi gửi: người đã bỏ theo dõi/tắt cờ không nhận; người theo dõi sau khi xuất bản không được thêm. Chương đang ẩn lúc xử lý sẽ bị bỏ qua và đánh dấu sự kiện đã xử lý.

Lỗi gửi làm rollback batch, giữ sự kiện để lần sau thử lại. UNIQUE(user_id, chapter_id) ngăn thông báo trùng. Đây là thông báo trong ứng dụng, chưa có email/push.

## API và giao diện

Tất cả endpoint yêu cầu xác thực, dùng UUID tài khoản từ Authentication do thành viên 1 cung cấp; không nhận userId từ client.

| Method | Đường dẫn | Chức năng |
| --- | --- | --- |
| GET | /api/v1/me/notifications?page=0&size=20&unreadOnly=false | Danh sách phân trang |
| GET | /api/v1/me/notifications/unread-count | Số chưa đọc |
| PATCH | /api/v1/me/notifications/{id}/read | Đánh dấu một thông báo đã đọc |
| PATCH | /api/v1/me/notifications/read-all | Đánh dấu tất cả đã đọc |

Mở http://localhost:3000/notifications hoặc bấm chuông trên navbar. Chuông cập nhật số chưa đọc mỗi 30 giây. Trang có bộ lọc, phân trang và đánh dấu đã đọc; bấm đọc chương sẽ đánh dấu trước khi chuyển trang. Khi chương/truyện không còn công khai, giao diện không cho mở từ thông báo. Snapshot tiêu đề được giữ nếu nội dung bị xóa; API đọc chương của thành viên 2 vẫn phải kiểm tra quyền/trạng thái.

Bật nhận thông báo cho từng truyện trong /library. Cần tài khoản thật và UUID truyện/chương thật; không dùng UUID Reader demo để thử xuất bản.

## Kiểm tra

Đã qua 38 unit test backend (8 test thông báo), TypeScript và lint phần mới. Test service dùng JDBC mock, chưa kiểm tra migration trên PostgreSQL hay toàn bộ luồng đăng nhập → theo dõi → xuất bản → nhận thông báo. Sau khi thành viên 1 và 2 tích hợp, thử: xuất bản lần đầu có một thông báo; sửa/ẩn/khôi phục không có thêm; tắt nhận thông báo không nhận; tài khoản khác không đánh dấu được thông báo của bạn; lỗi worker được thử lại.
