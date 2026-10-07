# Dự án đọc truyện Manga

Dự án môn J2EE sử dụng Next.js cho frontend, Spring Boot cho backend và PostgreSQL trên Supabase. Đăng nhập do backend quản lý; quyền Uploader thuộc từng nhóm dịch, tách biệt với vai trò hệ thống theo đặc tả v1.2.

## 1. Cấu trúc dự án

- `manga-backend-services/`: ứng dụng Spring Boot, Maven Wrapper, entity, DTO và API.
- `manga-frontend-services/`: ứng dụng Next.js App Router, TypeScript và Tailwind CSS.
- `Database/Project_setup_database.sql`: script khởi tạo schema PostgreSQL.
- `docs/`: tài liệu dự án.

## 2. Yêu cầu môi trường

| Công cụ | Yêu cầu |
| --- | --- |
| Java JDK | 21, theo cấu hình trong pom.xml |
| Node.js | Từ 20.9 trở lên cho Next.js 16 |
| npm | Đi kèm Node.js; dùng package-lock.json của dự án |
| Database | Supabase PostgreSQL có thông tin kết nối hợp lệ |
| Mạng | Cần khi tải dependency và kết nối Supabase; ảnh ngoài cần nguồn ảnh hoạt động |

Không cần cài Maven riêng vì backend có Maven Wrapper. Next.js 16.3.5, React 19.2.8 và Spring Boot 4.1.1 là các phiên bản đang khai báo trong repository.

Nguồn yêu cầu Node.js: [Tài liệu Next.js 16](https://nextjs.org/docs/app/guides/upgrading/version-16).

Kiểm tra trong PowerShell:

```powershell
java -version
javac -version
node --version
npm.cmd --version
```

Nếu Maven không tìm thấy Java, đặt JAVA_HOME tới thư mục JDK 21 và thêm thư mục bin của JDK vào PATH, sau đó mở lại terminal.

## 3. Chuẩn bị database

1. Mở project Supabase của nhóm, lấy thông tin kết nối PostgreSQL ở mục Connect.
2. Dùng database của nhóm đã được khởi tạo, hoặc tạo database/project riêng để phát triển.
3. Với database mới chưa có các bảng, mở SQL Editor và chạy nội dung file `Database/Project_setup_database.sql`.
4. Nếu database đã có các bảng này, không chạy lại toàn bộ script: phần CREATE TABLE không có IF NOT EXISTS. Dùng migration được nhóm thống nhất để cập nhật schema.

Script chỉ tạo schema, không thêm truyện hoặc chương mẫu. Backend cấu hình `spring.jpa.hibernate.ddl-auto=none`, nên không tự tạo bảng khi khởi động.

Lấy host, port, database và username đúng từ Supabase; username của pooler có thể chứa mã project. Mật khẩu cần dùng là mật khẩu database, không phải anon key hay service role key. Chuỗi JDBC có dạng:

```text
jdbc:postgresql://<HOST>:<PORT>/<DATABASE>?sslmode=require
```

Backend kết nối PostgreSQL trực tiếp qua JDBC; frontend hiện chưa cần Supabase key để chạy giao diện mẫu.

## 4. Chạy backend

Mở terminal PowerShell thứ nhất. Các lệnh sau bắt đầu từ thư mục gốc repository:

```powershell
Set-Location .\manga-backend-services
$env:SPRING_DATASOURCE_URL = 'jdbc:postgresql://<HOST>:<PORT>/<DATABASE>?sslmode=require'
$env:SPRING_DATASOURCE_USERNAME = '<DATABASE_USERNAME>'
$dbCredential = Get-Credential -UserName $env:SPRING_DATASOURCE_USERNAME -Message 'Nhập mật khẩu database Supabase'
$env:SPRING_DATASOURCE_PASSWORD = $dbCredential.GetNetworkCredential().Password
.\mvnw.cmd spring-boot:run
```

Thay các placeholder bằng thông tin database thực tế. Get-Credential mở hộp nhập mật khẩu để không ghi mật khẩu trực tiếp vào lệnh. Các biến môi trường chỉ áp dụng trong terminal hiện tại và ghi đè cấu hình datasource trong application.properties. Spring Boot không tự đọc file .env.

Cổng backend mặc định: **8080**. Khởi động thành công khi log có dòng Started MangaBackendServicesApplication và không có lỗi kết nối database.

Kiểm tra API trong terminal khác:

```powershell
Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/mangas'
```

Database chưa có truyện có thể trả danh sách rỗng. API chi tiết dùng UUID nội bộ của bảng mangas:

```text
GET http://localhost:8080/api/v1/mangas/<MANGA_UUID>
```

Swagger dự kiến ở `http://localhost:8080/swagger-ui/index.html`, nhưng pom.xml đang dùng springdoc-openapi 2.6.0 cùng Spring Boot 4.1.1. Theo [bảng tương thích springdoc](https://springdoc.org/), Spring Boot 4 cần springdoc 3.x. Nếu build/khởi động hoặc Swagger lỗi liên quan springdoc, nhóm cần chọn bản 3.x phù hợp; hướng dẫn này chưa thay đổi dependency.

Cấu hình SecurityConfig hiện cho phép truy cập /api/v1/** mà không xác thực. Đây là trạng thái phát triển hiện tại; các luồng tài khoản và quyền tương tác chưa được bảo vệ đầy đủ.

## 5. Chạy frontend

Mở terminal PowerShell thứ hai từ thư mục gốc repository:

```powershell
Set-Location .\manga-frontend-services
npm.cmd ci
Set-Content -LiteralPath .env.local -Value 'NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1' -Encoding utf8
npm.cmd run dev
```

Chỉ chạy lệnh Set-Content khi chưa có .env.local hoặc muốn tạo lại file; nếu đã có các biến khác, sửa/thêm NEXT_PUBLIC_API_URL trong file để giữ cấu hình hiện có. Đây cũng là URL mặc định của lib/api.ts.

Mở **http://localhost:3000**. Các trang có thể xem giao diện mẫu:

- Trang chủ: `http://localhost:3000`.
- Chi tiết truyện: `http://localhost:3000/manga/demo`.
- Reader: `http://localhost:3000/chapter/c1`.

Các trang chi tiết và Reader hiện dùng dữ liệu mock. Reader dùng hash và tên ảnh giả nên ảnh chương có thể không tải được; chạy server thành công chưa đồng nghĩa đã đọc được chương thực tế. Các trang động cũng đang đọc params trực tiếp theo kiểu cũ; nếu Next.js 16 báo lỗi Promise params, cần cập nhật trang theo API của phiên bản hiện tại.

Nếu cổng 3000 bận, Next.js có thể chọn cổng khác; xem địa chỉ trong terminal. Backend hiện chỉ khai báo CORS cho http://localhost:3000, nên cần điều chỉnh CORS nếu gọi API từ trình duyệt ở cổng khác.

Không đưa mật khẩu database hoặc service role key vào biến NEXT_PUBLIC_* vì các biến này có thể được đưa vào mã frontend.

## 6. Trạng thái tích hợp API hiện tại

| Chức năng | Backend đã có | Frontend lib/api.ts đang gọi |
| --- | --- | --- |
| Danh sách truyện | GET /api/v1/mangas | GET /api/v1/manga?page=...&limit=... |
| Chi tiết truyện | GET /api/v1/mangas/{id} | GET /api/v1/manga/{id} |
| Danh sách chương | Chưa có endpoint trong controller hiện tại | GET /api/v1/manga/{id}/chapters |
| Đọc chương | Chưa có endpoint trong controller hiện tại | GET /api/v1/chapter/{id} |

Đổi NEXT_PUBLIC_API_URL không giải quyết khác biệt manga/mangas. Cần thống nhất đường dẫn, response và phân trang trước khi ghép dữ liệu thật. API danh sách hiện trả List<Manga>, chưa xử lý page/limit.

Entity và DTO đã có cho một số chức năng tương tác, nhưng chưa có controller/service hoàn chỉnh cho bookmark, lịch sử, bình luận và rating. Schema hiện cũng chưa có bảng notification, cờ bật thông báo bookmark hay cấu trúc thành viên/quyền theo nhóm đầy đủ; cần bổ sung theo đặc tả trước khi triển khai các luồng đó.

## 7. Lệnh kiểm tra và build

Backend, từ thư mục manga-backend-services:

```powershell
.\mvnw.cmd test
.\mvnw.cmd clean package
java -jar .\target\manga-backend-services-0.0.1-SNAPSHOT.jar
```

Test context hiện tại và chạy ứng dụng cần cấu hình database hợp lệ. Giữ các biến môi trường datasource trong terminal chạy lệnh. Dừng tiến trình chạy trước bằng Ctrl+C nếu cần dùng lại cổng 8080.

Frontend, từ thư mục manga-frontend-services:

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd run start
```

Chạy build thành công trước start. Lint và build là hai bước riêng. Dùng Ctrl+C để dừng server.

## 8. Lỗi thường gặp

| Hiện tượng | Cách kiểm tra |
| --- | --- |
| npm.ps1 bị PowerShell chặn | Dùng npm.cmd như các lệnh trong tài liệu |
| JAVA_HOME sai hoặc invalid target release: 21 | Kiểm tra JDK 21, JAVA_HOME và javac -version |
| Maven không tải được dependency | Kiểm tra mạng, proxy và khả năng truy cập Maven Central; đối chiếu version khai báo, không tự đổi version ngẫu nhiên |
| Database authentication failed | Kiểm tra database password và username lấy từ Supabase Connect |
| Database timeout / unknown host | Kiểm tra host, port, trạng thái project và đường kết nối; dùng pooler phù hợp nếu mạng không hỗ trợ direct connection |
| relation does not exist | Schema chưa được khởi tạo hoặc đang kết nối sai database/schema |
| API trả 404 | Dùng đúng /api/v1/mangas; API chapter và tương tác chưa được triển khai |
| Swagger lỗi class hoặc method | Kiểm tra cặp Spring Boot 4 và springdoc 3.x |
| Reader không hiển thị ảnh | Dữ liệu Reader hiện là mock; kiểm tra URL ảnh/hash, không chỉ cổng server |
| params là Promise | Cập nhật các trang động theo API params của Next.js 16 |
| CORS khi gọi API trên trình duyệt | Kiểm tra frontend chạy đúng http://localhost:3000 hoặc cập nhật origin backend |

## 9. Phần việc thành viên 3

Ưu tiên: API danh sách trang chương và Reader → tiến độ/lịch sử đọc → bookmark → bình luận/rating → thông báo chương LOCAL lần đầu xuất bản. Phối hợp thành viên 1 về người dùng đăng nhập, thành viên 2 về truyện/chương và sự kiện xuất bản, thành viên 4 về nội dung bị ẩn và kiểm duyệt.

Lộ trình chức năng không phản ánh toàn bộ tính năng đã hoàn thành trong repository. Tài liệu này mô tả cấu hình và giới hạn hiện có; cần chạy kiểm tra sau khi nhóm giải quyết các điểm tích hợp nêu trên.
