# Bàn giao phần thành viên 3

## Những việc đã làm

| Phần việc | Backend | Frontend |
| --- | --- | --- |
| Reader | API chương demo và trang ảnh mẫu | Reader tải ảnh, xử lý lỗi, thử lại |
| Tiến độ đọc UC09 | Lưu/cập nhật tiến độ, kiểm tra tài khoản và chương, lịch sử phân trang | Debounce lưu tiến độ, khôi phục vị trí, trang `/history` |
| Theo dõi UC08 | Theo dõi/bỏ theo dõi, thư mục và cờ nhận thông báo | Nút theo dõi và trang `/library` |
| Bình luận | Bình luận/trả lời, spoiler, sửa, xóa mềm, kiểm tra ban/mute | Ghép vào trang truyện và chương |
| Rating | Đánh giá 1–5 sao, cập nhật đánh giá cá nhân và điểm tổng hợp | Chọn sao và hiển thị điểm thật |
| Thông báo | API hộp thông báo, đánh dấu đã đọc, sự kiện xuất bản và worker thử lại, chống trùng | Chuông số chưa đọc, trang `/notifications`, bộ lọc và phân trang |

Đã cập nhật README hướng dẫn chạy dự án, cấu hình môi trường và xử lý lỗi. Đồng bộ eslint-config-next với Next.js và springdoc với Spring Boot hiện tại.

## Tài liệu API và tích hợp

- [Reader mẫu cho thành viên 2](reader-api-sample.md)
- [Tiến độ demo](reading-progress-demo.md) và [tích hợp UC09 với tài khoản](uc09-account-integration.md)
- [Bookmark và tủ sách](bookmark-library.md)
- [Bình luận](comments.md)
- [Rating](rating.md)
- [Thông báo và hook xuất bản](notifications.md)

## Những việc còn cần phối hợp

1. Thành viên 1 nối xác thực Spring Security để Authentication trả UUID tài khoản nội bộ. Các API cá nhân không nhận userId từ trình duyệt.
2. Thành viên 2 ghép dữ liệu truyện/chương thật thay metadata mẫu, nối API trang ảnh và gọi ChapterNotificationService trong cùng transaction xuất bản chương.
3. Nhóm kiểm tra và chạy migration `001`, `002`, `003` theo thứ tự trong database Supabase; chưa tự chạy vào database nhóm. Bật `NOTIFICATIONS_WORKER_ENABLED=true` sau migration và khởi động lại backend.
4. Phối hợp thành viên 4 về nội dung bị ẩn, quyền kiểm duyệt và ban/mute.
5. Kiểm thử toàn luồng với tài khoản và database thật trước khi xác nhận hoàn tất.

Thông báo chỉ dành cho lần đầu xuất bản chương LOCAL, không gửi cho chương cũ, sửa hoặc khôi phục chương. Hiện chưa có hook xuất bản thật gọi service, chưa có email/push. Reader demo dùng dữ liệu mẫu và không thay thế kiểm thử tài khoản thật.

## Kết quả kiểm tra

- 38 unit test backend thành công, gồm Reader 4, tiến độ 4, Bookmark 8, bình luận 8, Rating 6 và thông báo 8.
- Next.js typegen và TypeScript `tsc --noEmit` thành công.
- Lint các phần đã sửa không có lỗi; còn một cảnh báo `<img>` sẵn có ở navbar trang chủ.
- API thông báo trả 401 khi chưa đăng nhập.
- Các test service dùng JDBC mock; chưa kiểm tra migration trên PostgreSQL hoặc toàn luồng đăng nhập/xuất bản/nhận thông báo.

## Kịch bản nghiệm thu

Đăng nhập → theo dõi truyện và bật thông báo → đọc rồi tải lại để khôi phục tiến độ → kiểm tra lịch sử/tủ sách → bình luận và trả lời spoiler → sửa/xóa bình luận của mình → đánh giá/cập nhật sao → xuất bản chương LOCAL mới → nhận một thông báo và đánh dấu đã đọc.

Kiểm tra thêm: tài khoản khác không sửa được dữ liệu cá nhân; tắt thông báo/bỏ theo dõi không nhận thông báo mới; sửa/ẩn/khôi phục chương không tạo thêm thông báo; worker lỗi có thể thử lại mà không tạo trùng.
