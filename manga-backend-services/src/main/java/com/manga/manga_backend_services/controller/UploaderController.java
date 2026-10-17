package com.manga.manga_backend_services.controller;

import com.manga.manga_backend_services.dto.request.UploaderChapterUpdateRequest;
import com.manga.manga_backend_services.dto.request.UploaderMangaRequest;
import com.manga.manga_backend_services.dto.response.*;
import com.manga.manga_backend_services.entity.User;
import com.manga.manga_backend_services.service.UploaderService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Thành viên 2 - Uploader Dashboard (nguồn LOCAL). Cần đăng nhập với ROLE_UPLOADER hoặc ROLE_ADMIN.
 */
@RestController
@RequestMapping("/api/v1/uploader")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class UploaderController {

    private final UploaderService uploaderService;

    @GetMapping("/stats")
    public UploaderStatsResponse stats(@AuthenticationPrincipal User user) {
        return uploaderService.stats(user);
    }

    @GetMapping("/tags")
    public List<TagResponse> tags(@AuthenticationPrincipal User user) {
        uploaderService.stats(user); // kiểm tra quyền
        return uploaderService.listTags();
    }

    @GetMapping("/mangas")
    public Map<String, Object> listMangas(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "local") String source,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return uploaderService.listMangas(user, source, keyword, page, size);
    }

    @PostMapping("/mangas")
    public MangaResponse createManga(@AuthenticationPrincipal User user, @Valid @RequestBody UploaderMangaRequest request) {
        return uploaderService.createManga(request, user);
    }

    @GetMapping("/mangas/{id}")
    public MangaResponse getManga(@AuthenticationPrincipal User user, @PathVariable UUID id) {
        return uploaderService.getManga(id, user);
    }

    @PutMapping("/mangas/{id}")
    public MangaResponse updateManga(@AuthenticationPrincipal User user, @PathVariable UUID id,
                                     @Valid @RequestBody UploaderMangaRequest request) {
        return uploaderService.updateManga(id, request, user);
    }

    @PostMapping(value = "/mangas/{id}/cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public MangaResponse uploadCover(@AuthenticationPrincipal User user, @PathVariable UUID id,
                                     @RequestPart("file") MultipartFile file) {
        return uploaderService.uploadCover(id, file, user);
    }

    @GetMapping("/mangas/{id}/chapters")
    public List<UploaderChapterResponse> listChapters(@AuthenticationPrincipal User user, @PathVariable UUID id) {
        return uploaderService.listChapters(id, user);
    }

    /** Upload chương mới: nhiều ảnh và/hoặc file .zip trong field "files" */
    @PostMapping(value = "/mangas/{id}/chapters", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UploaderChapterResponse createChapter(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @RequestParam String chapterNumber,
            @RequestParam(required = false) String volume,
            @RequestParam(required = false) String title,
            @RequestParam(defaultValue = "vi") String language,
            @RequestParam(defaultValue = "true") boolean publish,
            @RequestPart("files") List<MultipartFile> files
    ) {
        return uploaderService.createChapter(id, chapterNumber, volume, title, language, publish, files, user);
    }

    @PatchMapping("/chapters/{chapterId}")
    public UploaderChapterResponse updateChapter(@AuthenticationPrincipal User user, @PathVariable UUID chapterId,
                                                 @RequestBody UploaderChapterUpdateRequest request) {
        return uploaderService.updateChapter(chapterId, request, user);
    }

    @DeleteMapping("/chapters/{chapterId}")
    public ResponseEntity<Void> deleteChapter(@AuthenticationPrincipal User user, @PathVariable UUID chapterId) {
        uploaderService.deleteChapter(chapterId, user);
        return ResponseEntity.noContent().build();
    }

    // Giữ đúng mã lỗi HTTP thay vì để GlobalExceptionHandler đổi thành 400
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleStatus(ResponseStatusException ex) {
        return error(ex.getStatusCode().value(), ex.getReason() != null ? ex.getReason() : ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getDefaultMessage()).findFirst().orElse("Dữ liệu không hợp lệ");
        return error(400, message);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> handleTooLarge(MaxUploadSizeExceededException ex) {
        return error(413, "File upload quá lớn (tối đa 100MB mỗi file, 300MB mỗi lần gửi)");
    }

    private ResponseEntity<Map<String, String>> error(int status, String message) {
        Map<String, String> body = new LinkedHashMap<>();
        body.put("error", String.valueOf(status));
        body.put("message", message);
        return ResponseEntity.status(status).body(body);
    }
}
