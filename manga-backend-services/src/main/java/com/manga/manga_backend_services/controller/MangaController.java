package com.manga.manga_backend_services.controller;

import com.manga.manga_backend_services.entity.Manga;
import com.manga.manga_backend_services.repository.MangaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/mangas")
@CrossOrigin(origins = "http://localhost:3000") // Mở sẵn cho Next.js gọi
public class MangaController {

    private final MangaRepository mangaRepository;

    public MangaController(MangaRepository mangaRepository) {
        this.mangaRepository = mangaRepository;
    }

    @GetMapping
    public ResponseEntity<List<Manga>> getAllMangas() {
        return ResponseEntity.ok(mangaRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Manga> getMangaById(@PathVariable java.util.UUID id) {
        return mangaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}