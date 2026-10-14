iêp# UC09 tiến độ và lịch sử theo tài khoản

## Đã triển khai

- GET /api/v1/me/reading-progress/{mangaId}: vị trí đã lưu hoặc response rỗng khi chưa có lịch sử.
- PUT /api/v1/me/reading-progress/{mangaId}: body {"chapterId":"UUID nội bộ","lastPage":2}.
- GET /api/v1/me/reading-history?page=0&size=20: items, page, size, totalElements. Giới hạn size 1–100.
- Trang http://localhost:3000/history: lịch sử, ảnh bìa, % chương, thời gian tương đối, trạng thái không còn khả dụng, Đọc tiếp.
- Reader ngoài ID demo gọi API tài khoản; Guest tiếp tục đọc công khai nhưng không lưu lịch sử. Demo cũ vẫn dùng phiên demo, không tự ghi database.

Service dùng NamedParameterJdbcTemplate và PostgreSQL INSERT ON CONFLICT với unique(user_id,manga_id) đã có trong script. Không thay schema hoặc thêm dữ liệu vào database nhóm. last_page là trang hiện tại, không max trang đã đọc. read_at do database đặt. Chương phải published, truyện phải approved theo schema hiện tại, pages có thứ tự liên tục 1..N.

## Thành viên 1 cần nối xác thực

SecurityConfig bảo vệ /api/v1/me/** và trả HTTP 401 cho Guest; CORS cho http://localhost:3000 có credentials. Authentication.getName() phải là UUID nội bộ users.id; ReadingProgressService.currentUser kiểm tra người dùng tồn tại và không bị ban. Nếu principal của nhóm dùng email/username, cần sửa adapter currentUser cùng thành viên 1; không nhận userId từ request để giả danh tài khoản.

Frontend readerAccountRequest hiện gửi credentials: include, dùng phiên Spring Security nếu có. Nếu nhóm chọn JWT header, thành viên 1 nối interceptor/auth fetch vào hàm này. Chưa có API login/JWT trong repository nên không thể thử luồng tài khoản thật từ UI hiện tại. Không tạo tài khoản hoặc token giả để bypass xác thực. Khi đăng nhập xong, reload Reader/History để tải vị trí của tài khoản.

## Thành viên 2 cần nối dữ liệu chương

API danh sách trang thật giữ contract mẫu Reader, ID là UUID nội bộ. UC09 hiện lấy số trang từ chapter_pages; cần lưu metadata trang của chương MangaDex vào bảng này hoặc cung cấp adapter nguồn thống nhất trước khi dùng UC09 với chương chưa đồng bộ. Giữ trạng thái chương published và manga approval_status approved theo schema hiện tại. Khi schema đổi sang publication status theo đặc tả v1.2, cập nhật bộ kiểm tra trạng thái.

Lịch sử giữ dòng khi nội dung bị ẩn, không tự xóa do lỗi tải nguồn. Nếu trang giảm, response kẹp vị trí vào khoảng còn hợp lệ; không tự thay read_at khi GET. Không triển khai xóa cứng trong phần này.

## Cách kiểm tra khi auth sẵn sàng

1. Đăng nhập A, mở chương thật có chapter_pages hợp lệ; dừng ở trang 2, chờ Đã lưu.
2. Reload: mở trang 2; /history có đúng truyện, chương và tỷ lệ.
3. Đọc lùi trang 1 rồi reload: mở trang 1.
4. Đăng nhập B: không thấy lịch sử A. Guest nhận 401 khi gọi /me API nhưng đọc công khai được.
5. Gửi chương của truyện khác hoặc trang quá giới hạn: 400, không đổi lịch sử.
6. Chương ẩn/truyện chưa approved: không lưu mới; lịch sử cũ hiển thị không còn khả dụng.
7. Đọc tới trang cuối: 100%; đổi trang làm thời điểm đọc cập nhật.

Mẫu Reader demo vẫn chạy độc lập như docs/reading-progress-demo.md. Chưa kiểm thử ghi/đọc PostgreSQL trực tiếp với tài khoản thật vì auth và dữ liệu chương thật chưa được nối. Nhiều tab hiện áp dụng cập nhật ghi sau cùng; nhóm cần chốt cách giải quyết xung đột nếu muốn chính sách khác. Lưu trên frontend có debounce 800 ms và xếp hàng trong cùng Reader; không đảm bảo lưu khi đóng trang trước khi thấy Đã lưu.

## Kết quả kiểm tra

Compile và 8 test backend pass; TypeScript, Next.js typegen và lint các file thay đổi pass. API /me/reading-history đang chạy trả 401 với Guest và đúng CORS origin; API Reader demo vẫn trả 3 trang. Chưa kiểm thử end-to-end tài khoản thật hoặc ghi SQL vào database nhóm.
