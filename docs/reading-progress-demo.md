# Mẫu UC09 lưu vị trí đọc

## Thử chức năng

1. Khởi động backend với reader.demo.enabled=true như mẫu Reader; frontend ở http://localhost:3000, backend 8080. Hai phía dùng localhost, không đổi một phía sang 127.0.0.1.
2. Mở http://localhost:3000/chapter/33333333-3333-4333-8333-333333333333.
3. Cuộn đến trang 2, dừng ít nhất 800 ms và chờ trạng thái Đã lưu.
4. Reload trang: Reader cuộn tới trang 2.
5. Đọc tới trang 3: hiển thị 100%. Đọc lùi về trang 1, chờ Đã lưu rồi reload: mở trang 1.
6. Dừng backend, cuộn trang: không báo lưu thành công; khởi động lại và thử lại tiến độ.

Nếu dùng code backend cũ đang chạy, cần restart để nhận API mới. API trả trạng thái chưa có tiến độ khi phiên mới; không đọc localStorage.

## API demo

GET /api/v1/reader-demo/progress/{mangaId}

PUT /api/v1/reader-demo/progress/{mangaId}

Body:

```json
{ "chapterId": "33333333-3333-4333-8333-333333333333", "lastPage": 2 }
```

Response gồm mangaId, chapterId, lastPage, totalPages, percentage, readAt. Với trang 2/3, percentage khoảng 66.67; trang cuối là 100%. Trang ngoài 1–3 hoặc chương không thuộc fixture bị từ chối, không thay đổi tiến độ đã lưu.

Frontend gửi credentials: include; backend cho CORS với credentials tại localhost:3000. Cookie JSESSIONID nhận diện phiên demo. Các request lưu được xếp hàng để hạn chế ghi đè do phản hồi mạng chậm trong cùng Reader. Mẫu chưa xử lý xung đột nhiều tab và không đảm bảo lưu khi đóng trang trước khi nhận Đã lưu.

## Giới hạn và bước ghép thật

Đây là bản demo dùng HttpSession, không phải lịch sử tài khoản UC09 hoàn chỉnh. Mất phiên hoặc backend restart có thể mất vị trí. Guest đọc truyện thật không được ghi lịch sử tài khoản; API demo chỉ bật bởi reader.demo.enabled=true, chỉ dùng ID fixture.

Khi thành viên 1 hoàn thành auth và thành viên 2 cung cấp chương thật:

- API thật GET/PUT /api/v1/me/reading-progress/{mangaId}, lấy user từ Spring Security, kiểm tra ban; không nhận userId do client chọn.
- Đọc/ghi bảng reading_history với unique(user_id,manga_id), kiểm tra chương thuộc truyện công khai và trang hợp lệ theo danh sách thật.
- Giữ tiến độ hiện tại gần nhất, không max(last_page); read_at do backend đặt.
- Điểm % tính từ số trang hiện có, không tin giá trị frontend; khi số trang đổi, đưa vị trí về khoảng hợp lệ.
- Lịch sử mới tới cũ và trạng thái nội dung không còn khả dụng là bước tiếp theo.
- Chốt cơ chế nhiều tab với nhóm. Hiện chỉ xếp hàng thao tác trong một Reader.

Các thay đổi chính: ReaderDemoController, DemoProgressReader, ReaderCanvas và lib/api.ts. Không có migration hoặc ghi database nhóm trong mẫu này.
