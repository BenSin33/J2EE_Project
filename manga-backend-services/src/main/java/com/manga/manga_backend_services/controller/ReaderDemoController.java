package com.manga.manga_backend_services.controller;

import com.manga.manga_backend_services.dto.response.ReaderChapterResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;
import java.time.OffsetDateTime;
import jakarta.servlet.http.HttpSession;
import java.util.stream.IntStream;

/** Temporary fixture for member 2 to review. Disabled unless explicitly enabled. */
@RestController
@ConditionalOnProperty(name = "reader.demo.enabled", havingValue = "true")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RequestMapping("/api/v1")
public class ReaderDemoController {
    public static final UUID CHAPTER_ID = UUID.fromString("33333333-3333-4333-8333-333333333333");
    public static final UUID MANGA_ID = UUID.fromString("22222222-2222-4222-8222-222222222222");

    public record ProgressRequest(UUID chapterId, int lastPage) {}
    public record Progress(UUID mangaId, UUID chapterId, int lastPage, int totalPages,
                           double percentage, OffsetDateTime readAt) {}

    // Demo-only session storage; production must use authenticated user + reading_history.
    @GetMapping("/reader-demo/progress/{mangaId}")
    public Progress progress(@PathVariable UUID mangaId, HttpSession session) {
        if (!MANGA_ID.equals(mangaId)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return (Progress) session.getAttribute("reader-demo-progress");
    }

    @PutMapping("/reader-demo/progress/{mangaId}")
    public Progress saveProgress(@PathVariable UUID mangaId, @RequestBody ProgressRequest request, HttpSession session) {
        if (!MANGA_ID.equals(mangaId)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        if (!CHAPTER_ID.equals(request.chapterId()) || request.lastPage() < 1 || request.lastPage() > 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chapter or page is invalid");
        }
        var result = new Progress(mangaId, request.chapterId(), request.lastPage(), 3,
                request.lastPage() * 100.0 / 3, OffsetDateTime.now());
        session.setAttribute("reader-demo-progress", result);
        return result;
    }

    @GetMapping("/chapters/{chapterId}/pages")
    public ReaderChapterResponse pages(@PathVariable UUID chapterId) {
        if (!CHAPTER_ID.equals(chapterId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not available");
        }
        var pages = IntStream.rangeClosed(1, 3)
                .mapToObj(n -> new ReaderChapterResponse.Page(n,
                        "/api/v1/reader-demo/images/" + n, 800, 1100))
                .toList();
        return new ReaderChapterResponse(MANGA_ID, CHAPTER_ID,
                "Reader integration demo", "1", "LOCAL", pages.size(), pages);
    }

    @GetMapping(value = "/reader-demo/images/{page}", produces = "image/svg+xml")
    public String image(@PathVariable int page) {
        if (page < 1 || page > 3) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        return """
                <svg xmlns="http://www.w3.org/2000/svg" width="800" height="1100" viewBox="0 0 800 1100">
                  <rect width="800" height="1100" fill="#e8edf2"/>
                  <rect x="40" y="100" width="720" height="390" fill="#bacada" stroke="#263544" stroke-width="5"/>
                  <rect x="40" y="530" width="340" height="450" fill="#d3bdab" stroke="#263544" stroke-width="5"/>
                  <rect x="420" y="530" width="340" height="450" fill="#b8cbbd" stroke="#263544" stroke-width="5"/>
                  <g font-family="sans-serif" text-anchor="middle" fill="#263544">
                    <text x="400" y="65" font-size="30">READER DEMO - PAGE %d / 3</text>
                    <text x="400" y="290" font-size="28">Sample panel</text>
                    <text x="400" y="1040" font-size="22">API image loading and page order fixture</text>
                  </g>
                </svg>
                """.formatted(page);
    }
}
