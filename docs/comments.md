# Bình luận và trả lời

## Cài đặt

Chạy Database/migrations/002_comments_soft_delete_and_mute.sql trong Supabase SQL Editor trước khi xem bình luận thật. Migration bổ sung comments.is_deleted, updated_at, users.muted_until, mute_reason và index. Chưa chạy migration vào database nhóm trong phiên này. Database/project_database_v2.sql chỉ là schema tham chiếu; không chạy toàn bộ để cập nhật.

Bình luận đã ghép dưới trang /manga/{UUID} và dưới Reader /chapter/{UUID}. Dùng ID truyện/chương thật, không phải ID fixture demo. Trang chi tiết truyện vẫn dùng metadata mock từ dự án cũ; API bình luận luôn kiểm tra bản ghi thực. Khi chưa có auth, có thể xem bình luận công khai; gửi/sửa/xóa yêu cầu đăng nhập.

## API

| Method | Route | Chức năng |
| --- | --- | --- |
| GET | /api/v1/mangas/{mangaId}/comments?page=0&size=20 | Bình luận chính trên truyện |
| GET | Cùng route, thêm chapterId={UUID} | Bình luận chính trên chương |
| GET | Cùng route, thêm parentId={UUID} và chapterId nếu là chương | Danh sách trả lời |
| POST | /api/v1/me/comments | Tạo bình luận hoặc trả lời |
| PATCH | /api/v1/me/comments/{id} | Chủ bình luận sửa |
| DELETE | /api/v1/me/comments/{id} | Chủ bình luận xóa mềm, trả 204 |

POST body:

```json
{ "mangaId": "UUID nội bộ", "chapterId": null, "parentId": null, "content": "Nội dung bình luận", "spoiler": false }
```

chapterId có giá trị khi bình luận chương; parentId là ID bình luận chính khi trả lời. PATCH gửi content và spoiler. Không có userId client chọn chủ sở hữu. Authentication.getName() là UUID nội bộ users.id như UC09; frontend dùng credentials: include. Nếu dùng JWT cần nối interceptor vào readerAccountRequest với thành viên 1.

## Quy tắc đã triển khai

- Hai cấp: bình luận chính và trả lời; chưa triển khai lồng nhiều cấp. Trả lời phải cùng truyện/chương với bình luận chính.
- Truyện approved, chương published thuộc đúng truyện mới xem/tạo/sửa được theo schema hiện tại.
- Nội dung không rỗng sau strip, giới hạn backend comments.max-length mặc định 2000; UI dùng 2000. Khi nhóm đổi cấu hình cần đồng bộ giới hạn UI.
- Ban chặn thao tác cá nhân. Mute chặn tạo/trả lời/sửa; chủ bình luận vẫn được xóa mềm để gỡ nội dung của mình.
- muted_until còn hạn chặn bình luận, hết hạn cho phép lại. Nếu legacy is_muted=true nhưng chưa có muted_until thì tiếp tục chặn đến khi Mod cập nhật; không tự bỏ hạn chế cũ. mute_reason là trường dữ liệu cho thành viên 4 ghi khi kiểm duyệt, API cá nhân không tự thay mute.
- Chỉ chủ bình luận sửa/xóa. Không tự bỏ is_hidden khi sửa. Bình luận hidden hoặc deleted không được sửa hoặc nhận trả lời mới.
- Xóa mềm chỉ đánh dấu is_deleted và updated_at, không xóa record hay trả lời; giữ nội dung trong database cho quản trị, nhưng mọi response công khai che content khi hidden/deleted.
- Spoiler vẫn có nội dung trong API, UI che và cho bấm xem; đây là tránh tiết lộ nội dung truyện, không phải kiểm soát truy cập.
- Response có canEdit/canDelete theo người xem để UI hiện nút; backend vẫn kiểm tra lại quyền ở mọi thao tác.
- Pagination riêng cho bình luận chính và trả lời, mới tới cũ, size 1–50. Hiển thị bình luận bị xóa/ẩn dưới dạng thông báo để giữ ngữ cảnh trả lời.

## Kiểm tra khi auth và migration sẵn sàng

1. Guest xem bình luận, không tạo/sửa/xóa được.
2. A tạo bình luận spoiler: nội dung bị che ở UI; bấm xem được.
3. B trả lời A: cùng scope. Trả lời nhầm chương/truyện bị từ chối.
4. B không sửa/xóa bình luận A dù gọi API trực tiếp.
5. A sửa nội dung, cập nhật spoiler; phản hồi vẫn còn.
6. A xóa mềm: hiện Bình luận đã được xóa, trả lời B vẫn xem được.
7. Mod ẩn: response không có nội dung và chủ không sửa để khôi phục.
8. Mute đang hiệu lực chặn tạo/trả lời/sửa; sau hết hạn cho phép lại nếu không ban.
9. Lỗi mạng giữ bản nháp ở form, không báo gửi thành công. Form disable khi đang gửi.

Chưa có UI Mod xử lý báo cáo/ẩn/mute trong phần này; thành viên 4 sẽ nối các trường kiểm duyệt. Chưa kiểm thử toàn bộ luồng tài khoản thật/database nhóm vì auth chưa hoàn thành và migration chưa được chạy.

## Kết quả kiểm tra

Compile và 24 test backend (8 bình luận, 16 hồi quy) pass; Next.js typegen, TypeScript và lint phần mới pass. Guest POST /me/comments nhận 401 với CORS đúng; git diff --check pass. Kiểm thử service dùng database mock, chưa kiểm thử SQL ghi/đọc trực tiếp hoặc end-to-end tài khoản thật trên Supabase.
