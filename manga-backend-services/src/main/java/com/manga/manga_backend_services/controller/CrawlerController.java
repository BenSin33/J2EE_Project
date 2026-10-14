package com.manga.manga_backend_services.controller;

import com.manga.manga_backend_services.dto.request.MangaDexImportRequest;
import com.manga.manga_backend_services.dto.response.MangaDexImportResponse;
import com.manga.manga_backend_services.dto.response.MangaDexSearchResult;
import com.manga.manga_backend_services.service.MangaDexService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/crawler/mangadex")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class CrawlerController {

    private final MangaDexService mangaDexService;

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
     * Cào một truyện từ MangaDex (nhập link hoặc MangaDex UUID)
     */
    @PostMapping("/import")
    public ResponseEntity<MangaDexImportResponse> importManga(
            @Valid @RequestBody MangaDexImportRequest request
    ) {
        return ResponseEntity.ok(mangaDexService.importManga(
                request.getUrlOrId(),
                request.getLanguage(),
                request.getMaxChapters()
        ));
    }
}
