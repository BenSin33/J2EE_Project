# Mẫu API Reader gửi thành viên 2

Mẫu cho thành viên 3 ghép Reader với dữ liệu chương. Chưa triển khai lưu tiến độ, xác thực người dùng hoặc thông báo. Không thay đổi database nhóm.

## Chạy mẫu

Backend vẫn cần cấu hình Supabase hợp lệ như README; ứng dụng hiện có JPA và kiểm tra kết nối database khi khởi động. Bật endpoint demo trong terminal backend:

```powershell
Set-Location D:\Study\J2EE\J2EE_Project\manga-backend-services
$env:READER_DEMO_ENABLED = 'true'
.\mvnw.cmd spring-boot:run
# Nếu Maven Wrapper lỗi, dùng Maven đã cài:
# mvn spring-boot:run
```

Frontend, terminal khác:

```powershell
Set-Location D:\Study\J2EE\J2EE_Project\manga-frontend-services
npm.cmd ci
npm.cmd run dev
```

NEXT_PUBLIC_API_URL mặc định là http://localhost:8080/api/v1. Nếu đổi biến này, restart Next.js. Mở:

http://localhost:3000/chapter/33333333-3333-4333-8333-333333333333

API: GET http://localhost:8080/api/v1/chapters/33333333-3333-4333-8333-333333333333/pages

Ảnh mẫu là SVG kiểm tra thứ tự và tải ảnh, không phải trang truyện thật. Endpoint và ID chỉ tồn tại khi bật demo; UUID khác trả 404, ID sai định dạng trả 400. Tắt demo bằng cách xóa biến READER_DEMO_ENABLED rồi restart backend. Không bật demo khi triển khai thật.

## Response đề xuất

```json
{
  "mangaId": "22222222-2222-4222-8222-222222222222",
  "chapterId": "33333333-3333-4333-8333-333333333333",
  "title": "Reader integration demo",
  "chapterNumber": "1",
  "source": "LOCAL",
  "totalPages": 3,
  "pages": [
    { "pageNumber": 1, "imageUrl": "/api/v1/reader-demo/images/1", "width": 800, "height": 1100 },
    { "pageNumber": 2, "imageUrl": "/api/v1/reader-demo/images/2", "width": 800, "height": 1100 },
    { "pageNumber": 3, "imageUrl": "/api/v1/reader-demo/images/3", "width": 800, "height": 1100 }
  ]
}
```

## Thành viên 2 cần cung cấp

- Giữ route GET /api/v1/chapters/{chapterId}/pages và DTO ReaderChapterResponse hoặc thống nhất thay đổi với thành viên 3.
- mangaId và chapterId là UUID nội bộ; ID MangaDex ánh xạ ở backend.
- source là LOCAL hoặc MANGADEX, khác storage_type.
- pages sắp tăng dần, liên tục từ 1; totalPages bằng số phần tử. width/height là kích thước ảnh thực, số nguyên dương để Reader giữ bố cục khi lazy-load.
- imageUrl là URL tải được trực tiếp (ưu tiên URL HTTPS đầy đủ). Demo dùng đường dẫn bắt đầu bằng / và frontend giải theo origin backend. Không trả tên file/hash chưa ghép URL.
- Với MangaDex, backend chuẩn bị URL trang từ kết quả nguồn; frontend không tự đoán host CDN hoặc xử lý hash.
- Chỉ trả chương công khai thuộc truyện công khai cho Guest; DRAFT/HIDDEN hoặc không tồn tại trả 404. Demo chỉ mô phỏng fixture, không có kiểm tra dữ liệu thật.
- Nguồn lỗi tạm thời trả lỗi 5xx phù hợp, không coi là mất nội dung vĩnh viễn. Lỗi tải ảnh có thể thử lại; không công khai chương thiếu trang.
- Signed URL nếu dùng phải đủ hạn cho phiên đọc; khi hết hạn frontend tải lại danh sách để nhận URL mới.

Khi nối dữ liệu thật, thay ReaderDemoController bằng controller/service đọc dữ liệu, tắt demo để tránh trùng route. ReaderCanvas và fetchReaderChapter tiếp tục dùng cùng contract. Chưa cần JWT cho chương công khai; API lưu tiến độ sau này phải lấy user từ Spring Security.

## Checklist nghiệm thu mẫu

1. Bật demo, gọi API: đúng 3 trang, số trang 1–3.
2. Mở Reader: hiện metadata và ba ảnh theo thứ tự, không gọi CDN ngoài.
3. Thử UUID khác: hiển thị chương không khả dụng và nút thử lại.
4. Dừng backend, tải lại Reader: hiển thị lỗi; khởi động backend rồi thử lại tải được.
5. Chặn một request ảnh trong DevTools: trang đó hiện nút thử lại, các trang khác vẫn đọc được.
6. Chuyển ID chương khi đang tải: request cũ bị hủy, không đè dữ liệu trang mới.

## Giới hạn hiện tại

Thanh công cụ cũ có nút trước/sau và cài đặt giao diện; mẫu này chưa thêm điều hướng chương hay áp dụng cài đặt đọc. Liên kết chi tiết dùng mangaId demo nên vẫn đi tới trang chi tiết đang dùng mock. Lưu tiến độ và debounce scroll là bước kế tiếp sau khi nhóm chốt contract.

## Kết quả kiểm tra cấu hình ngày 11 10 2026

- Backend compile và 2 test ReaderDemoControllerTests thành công.
- Maven Wrapper chạy được, Java 21. Lỗi AccessDenied trước đó do sandbox của phiên hỗ trợ giới hạn cache ngoài workspace, không phải bằng chứng JAR hỏng. Không cần xóa toàn bộ .m2 hoặc cài lại Java.
- Backend khởi động bằng cấu hình database hiện có; API demo, ảnh và /v3/api-docs trả HTTP 200 trên cổng kiểm tra 18080.
- TypeScript và lint các file Reader thành công.
- eslint-config-next đã cập nhật lên 16.4.0, khớp Next.js đang cài; springdoc lên 3.1.1 cho Spring Boot 4. .npm-cache được loại khỏi Git và ESLint.

Sau khi nhận thay đổi, chạy npm.cmd ci trong frontend. Nếu gặp lỗi LayoutProps khi chạy TypeScript trực tiếp, chạy npx.cmd next typegen trước. Chạy mẫu như hướng dẫn ở đầu file; mặc định backend/frontend vẫn là 8080/3000.
