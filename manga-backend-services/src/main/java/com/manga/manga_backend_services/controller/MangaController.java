package com.manga.manga_backend_services.controller;

import com.manga.manga_backend_services.entity.Manga;
import com.manga.manga_backend_services.repository.MangaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping({"/api/v1/mangas", "/api/v1/manga"})
@CrossOrigin(origins = "http://localhost:3000") // Mở sẵn cho Next.js gọi
public class MangaController {

    private final MangaRepository mangaRepository;

    public MangaController(MangaRepository mangaRepository) {
        this.mangaRepository = mangaRepository;
    }

    /**
     * API Giai đoạn 1 - Thành viên 4:
     * Lấy danh sách truyện có hỗ trợ Phân trang (Pagination) và Tìm kiếm cơ bản bằng chữ (Search by keyword).
     *
     * @param keyword Từ khóa tìm kiếm theo tên truyện (không bắt buộc)
     * @param page Số trang (bắt đầu từ 0, mặc định: 0)
     * @param limit Số lượng truyện trên mỗi trang (mặc định: 20)
     */
    @GetMapping
    public ResponseEntity<Page<Manga>> getMangas(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit
    ) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, limit), Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Manga> result;
        if (keyword != null && !keyword.trim().isEmpty()) {
            result = mangaRepository.findByTitleContainingIgnoreCase(keyword.trim(), pageable);
        } else {
            result = mangaRepository.findAll(pageable);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Manga> getMangaById(@PathVariable UUID id) {
        return mangaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}