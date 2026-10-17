package com.manga.manga_backend_services.controller;

import com.manga.manga_backend_services.dto.request.MangaDexImportRequest;
import com.manga.manga_backend_services.dto.response.ChapterMirrorResponse;
import com.manga.manga_backend_services.dto.response.MangaDexImportResponse;
import com.manga.manga_backend_services.dto.response.MangaDexSearchResult;
import com.manga.manga_backend_services.service.CloudinaryService;
import com.manga.manga_backend_services.service.MangaDexService;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Thành viên 2 - Cào dữ liệu từ MangaDex (chỉ ADMIN được gọi, xem SecurityConfig).
 * Trên Swagger: đăng nhập qua /api/auth/login, bấm "Authorize" và dán token vào bearerAuth.
 */
@RestController
@RequestMapping("/api/v1/crawler/mangadex")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
@SecurityScheme(name = "bearerAuth", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "JWT")
@SecurityRequirement(name = "bearerAuth")
public class CrawlerController {

    private final MangaDexService mangaDexService;
    private final CloudinaryService cloudinaryService;

    /**
     * Tìm kiếm truyện trên MangaDex trước khi cào
     */
    @GetMapping("/search")
    public ResponseEntity<List<MangaDexSearchResult>> searchManga(
            @RequestParam String title,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ResponseEntity.ok(mangaDexService.search(title, limit));
    }

    /**
     * Cào một truyện từ MangaDex (nhập link hoặc MangaDex UUID).
     * Gọi lại cùng truyện để cập nhật thông tin và bổ sung chương mới.
     */
    @PostMapping("/import")
    public ResponseEntity<MangaDexImportResponse> importManga(
            @Valid @RequestBody MangaDexImportRequest request
    ) {
        return ResponseEntity.ok(mangaDexService.importManga(request));
    }

    /**
     * Tải toàn bộ trang ảnh của một chương (đã cào) từ MangaDex, convert WebP và lưu lên Cloudinary
     */
    @PostMapping("/chapters/{chapterId}/mirror")
    public ResponseEntity<ChapterMirrorResponse> mirrorChapter(@PathVariable UUID chapterId) {
        return ResponseEntity.ok(mangaDexService.mirrorChapterToCloudinary(chapterId));
    }

    /**
     * Kiểm tra cấu hình crawler (Cloudinary đã bật chưa)
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("cloudinaryEnabled", cloudinaryService.isEnabled());
        return ResponseEntity.ok(body);
    }

    /**
     * Giữ nguyên mã lỗi HTTP (404, 429, 502...) thay vì để GlobalExceptionHandler đổi thành 400
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleStatus(ResponseStatusException ex) {
        Map<String, String> body = new LinkedHashMap<>();
        body.put("error", ex.getStatusCode().toString());
        body.put("message", ex.getReason() != null ? ex.getReason() : ex.getMessage());
        return ResponseEntity.status(ex.getStatusCode()).body(body);
    }
}
