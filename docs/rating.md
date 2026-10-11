# Đánh giá truyện 1 đến 5 sao

## Đã triển khai

GET /api/v1/mangas/{mangaId}/rating: xem công khai điểm tổng hợp, trả myRating khi có người xem đã xác thực hợp lệ.

PUT /api/v1/me/mangas/{mangaId}/rating: tạo/cập nhật đánh giá của chủ tài khoản, không nhận userId từ client.

Body PUT:

```json
{ "rating": 5 }
```

Response:

```json
{ "mangaId": "UUID nội bộ", "averageRating": 4.25, "ratingCount": 4, "myRating": 5 }
```

Chưa có đánh giá: averageRating=0, ratingCount=0, myRating=null. Guest không có myRating. API nhận số nguyên 1–5 (1.0 cũng là giá trị nguyên), từ chối 2.5, 0, 6 và null. Điểm trung bình làm tròn 2 chữ số, HALF_UP.

## Database và quyền

Dùng bảng manga_ratings với CHECK 1–5, NOT NULL và UNIQUE(user_id,manga_id) đã có trong Database/project_database_v2.sql. Không cần migration mới cho Rating nếu database đã đúng schema này. Không chạy toàn bộ schema tham chiếu để cập nhật database nhóm.

INSERT ON CONFLICT cập nhật rating_star; không tăng số lượt khi người dùng đổi điểm. Trước khi ghi, khóa dòng manga để các cập nhật điểm tổng hợp cho cùng truyện diễn ra lần lượt. rating_score/rating_count trong mangas được đồng bộ từ bảng rating trong cùng transaction. GET tính trực tiếp từ rating, không phụ thuộc số liệu cache cũ.

Tính tất cả đánh giá không null hiện có; ban không tự xóa đánh giá cũ. Mute không chặn rating, ban chặn thao tác có đăng nhập. Truyện phải approved theo schema hiện tại. Không có API xóa đánh giá ở phần này.

Authentication.getName() phải là UUID nội bộ users.id giống UC09/Bookmark; thành viên 1 cần nối auth. Frontend dùng readerAccountRequest với credentials: include; nếu JWT, cần gắn token ở hàm chung. Chưa có luồng đăng nhập thật trong repository nên Guest chỉ xem điểm và nhận yêu cầu đăng nhập khi gửi.

## Frontend

RatingPanel nằm dưới thông tin truyện ở /manga/{UUID}. Đã bỏ điểm 4.8 giả trong MangaHero. Panel hiển thị trung bình, số lượt và điểm cá nhân; chọn 1–5 sao bằng radio (hỗ trợ bàn phím), bấm Gửi/Cập nhật. Khi đang gửi, disable điều khiển; khi lỗi không giả báo thành công, giữ lựa chọn để thử lại. Cập nhật UI theo response đã xác nhận.

Trang truyện hiện vẫn dùng metadata mock từ dự án trước; phải dùng UUID truyện thật trong database để thử API Rating. ID demo/placeholder không tự tạo rating vào database nhóm.

## Nghiệm thu sau khi auth sẵn sàng

1. Guest GET truyện thật: điểm trung bình và số lượt, không lộ điểm cá nhân.
2. A đánh giá 3: một dòng. A đổi 5: vẫn một dòng, số lượt không tăng.
3. B đánh giá 1: trung bình 3.00 từ A=5, B=1, số lượt=2.
4. A không thay được đánh giá B vì API không nhận chủ sở hữu từ client.
5. Gửi 2.5/0/6/null: 400, không ghi dữ liệu.
6. Ban chặn đánh giá; hidden/draft theo approval_status không đánh giá được.
7. Yêu cầu đồng thời không tạo dòng trùng; điểm/count cache được đồng bộ trong transaction.

Chưa kiểm thử ghi/đọc bằng tài khoản thật trên Supabase vì auth chưa nối; tests service dùng database mock. Không thay đổi dữ liệu nhóm trong phiên này.

## Kết quả kiểm tra

Compile và 30 test backend pass (6 Rating, 24 hồi quy); TypeScript và lint phần mới pass. GET Rating với truyện thật trên database hiện có trả average=0.00,count=0,myRating=null cho Guest; PUT Guest trả 401. git diff --check pass. Chưa thực hiện ghi rating bằng tài khoản thật hoặc kiểm thử đồng thời trên Supabase.
