package com.manga.manga_backend_services.controller;

import com.manga.manga_backend_services.dto.response.ChapterResponse;
import com.manga.manga_backend_services.dto.response.MangaResponse;
import com.manga.manga_backend_services.service.MangaDexService;
import com.manga.manga_backend_services.service.MangaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/v1/mangas", "/api/v1/manga"})
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
@Tag(name = "Manga", description = "APIs quản lý và truy vấn truyện Manga")
public class MangaController {

    private final MangaService mangaService;
    private final MangaDexService mangaDexService;

    @Operation(summary = "Lấy danh sách truyện mới cập nhật")
    @GetMapping("/recent-updates")
    public ResponseEntity<List<MangaResponse>> getRecentUpdates() {
        return ResponseEntity.ok(mangaService.getRecentUpdates());
    }

    @Operation(summary = "Lấy top 10 truyện thịnh hành nhất")
    @GetMapping("/top-trending")
    public ResponseEntity<List<MangaResponse>> getTopTrending() {
        return ResponseEntity.ok(mangaService.getTopTrending());
    }

    @Operation(summary = "Lấy danh sách truyện có phân trang và tìm kiếm theo tên")
    @GetMapping
    public ResponseEntity<Page<MangaResponse>> getMangas(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit
    ) {
        return ResponseEntity.ok(mangaService.getMangas(keyword, page, limit));
    }

    @Operation(summary = "Lấy chi tiết truyện theo ID")
    @GetMapping("/{id}")
    public ResponseEntity<MangaResponse> getMangaById(@PathVariable UUID id) {
        MangaResponse response = mangaService.getMangaById(id);
        if (response == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Lấy danh sách chương của truyện")
    @GetMapping("/{id}/chapters")
    public ResponseEntity<List<ChapterResponse>> getChaptersByMangaId(@PathVariable UUID id) {
        return ResponseEntity.ok(mangaDexService.getChaptersByMangaId(id));
    }
}