package com.manga.manga_backend_services;

import com.manga.manga_backend_services.dto.request.MangaDexImportRequest;
import com.manga.manga_backend_services.dto.response.ChapterResponse;
import com.manga.manga_backend_services.dto.response.MangaDexImportResponse;
import com.manga.manga_backend_services.dto.response.MangaDexSearchResult;
import com.manga.manga_backend_services.dto.response.ReaderChapterResponse;
import com.manga.manga_backend_services.entity.Manga;
import com.manga.manga_backend_services.repository.ChapterPageRepository;
import com.manga.manga_backend_services.repository.ChapterRepository;
import com.manga.manga_backend_services.repository.MangaRepository;
import com.manga.manga_backend_services.service.MangaDexService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Seed dữ liệu thật từ MangaDex vào DB đang cấu hình (Supabase). Mặc định bị bỏ qua, chạy bằng:
 *   ./mvnw test -Dtest=MangaDexSeedTests -Dseed.mangadex=true
 * Tuỳ chọn: -Dseed.mangadex.ids=uuid1,uuid2 -Dseed.mangadex.chapters=30 -Dseed.mangadex.mirror=1
 */
@SpringBootTest
@EnabledIfSystemProperty(named = "seed.mangadex", matches = "true")
class MangaDexSeedTests {

    // SPY×FAMILY và Kage no Jitsuryokusha ni Naritakute! (đều có chương tiếng Việt trên MangaDex)
    private static final String DEFAULT_IDS = "6b958848-c885-4735-9201-12ee77abcb3c,77bee52c-d2d6-44ad-a33a-1734c1fe696a";

    @Autowired
    MangaDexService mangaDexService;

    @Autowired
    MangaRepository mangaRepository;

    @Autowired
    ChapterRepository chapterRepository;

    @Autowired
    ChapterPageRepository chapterPageRepository;

    @Autowired
    JdbcTemplate jdbcTemplate;

    @Test
    void inspectCleanAndCrawlYofukashiNoUta() {
        System.out.println("=== 1. DANH SÁCH TRUYỆN HIỆN CÓ TRONG DATABASE ===");
        List<Manga> allMangas = mangaRepository.findAll();
        for (Manga m : allMangas) {
            long chCount = chapterRepository.findByMangaId(m.getId()).size();
            System.out.printf(" - ID: %s | Title: %s | MangaDexID: %s | Cover: %s | Chapters: %d%n",
                    m.getId(), m.getTitle(), m.getMangadexId(), m.getCoverImageUrl(), chCount);
        }

        // Xóa dữ liệu mẫu (One Piece giả, Naruto giả, [TEST] Truyện thử Uploader, hoặc các truyện local không có mangadex_id / ảnh giả)
        System.out.println("=== 2. XÓA DỮ LIỆU MẪU GIẢ TRONG DATABASE ===");
        for (Manga m : allMangas) {
            boolean isSample = m.getMangadexId() == null
                    || (m.getCoverImageUrl() != null && m.getCoverImageUrl().contains("example.com"))
                    || (m.getTitle() != null && m.getTitle().startsWith("[TEST]"))
                    || "d0000000-0000-0000-0000-000000000001".equals(m.getId().toString())
                    || "d0000000-0000-0000-0000-000000000002".equals(m.getId().toString());
            if (isSample) {
                UUID mid = m.getId();
                System.out.println(" -> Đang xóa truyện mẫu: " + m.getTitle() + " (" + mid + ")");
                jdbcTemplate.update("DELETE FROM chapter_pages WHERE chapter_id IN (SELECT id FROM chapters WHERE manga_id = ?)", mid);
                jdbcTemplate.update("DELETE FROM chapter_reports WHERE chapter_id IN (SELECT id FROM chapters WHERE manga_id = ?)", mid);
                jdbcTemplate.update("DELETE FROM reading_history WHERE manga_id = ?", mid);
                jdbcTemplate.update("DELETE FROM bookmarks WHERE manga_id = ?", mid);
                jdbcTemplate.update("DELETE FROM manga_ratings WHERE manga_id = ?", mid);
                jdbcTemplate.update("DELETE FROM comments WHERE manga_id = ?", mid);
                jdbcTemplate.update("DELETE FROM home_showcases WHERE manga_id = ?", mid);
                jdbcTemplate.update("DELETE FROM chapters WHERE manga_id = ?", mid);
                jdbcTemplate.update("DELETE FROM manga_authors WHERE manga_id = ?", mid);
                jdbcTemplate.update("DELETE FROM manga_tags WHERE manga_id = ?", mid);
                jdbcTemplate.update("DELETE FROM mangas WHERE id = ?", mid);
            }
        }

        System.out.println("=== 3. TÌM KIẾM VÀ CÀO TRUYỆN 'Yofukashi no Uta' TỪ MANGADEX ===");
        List<MangaDexSearchResult> searchResults = mangaDexService.search("Yofukashi no Uta", 5);
        for (MangaDexSearchResult sr : searchResults) {
            System.out.printf(" [Search] %s | MangaDexID: %s | Languages: %s%n",
                    sr.getTitle(), sr.getMangadexId(), sr.getAvailableLanguages());
        }
        assertFalse(searchResults.isEmpty(), "Không tìm thấy Yofukashi no Uta trên MangaDex");

        // Lấy kết quả chính xác của Yofukashi no Uta (259dfd8a-f06a-4825-8fa6-a2dcd7274230 hoặc kết quả đầu tiên)
        UUID targetMangadexId = searchResults.stream()
                .filter(s -> "259dfd8a-f06a-4825-8fa6-a2dcd7274230".equals(s.getMangadexId().toString()))
                .map(MangaDexSearchResult::getMangadexId)
                .findFirst()
                .orElse(searchResults.getFirst().getMangadexId());

        MangaDexImportResponse imported = mangaDexService.importManga(MangaDexImportRequest.builder()
                .urlOrId(targetMangadexId.toString())
                .language("vi")
                .maxChapters(50)
                .uploadCover(true)
                .mirrorChapters(0)
                .build());

        System.out.printf("=== ĐÃ CÀO: %s (ID nội bộ: %s) | Số chương: %d (%s) | Mirrored: %d | Warnings: %s ===%n",
                imported.getTitle(), imported.getMangaId(), imported.getChaptersImported(),
                imported.getChapterLanguage(), imported.getChaptersMirrored(), imported.getWarnings());

        List<ChapterResponse> chapters = mangaDexService.getChaptersByMangaId(imported.getMangaId());
        System.out.println("=== DANH SÁCH CHƯƠNG ĐÃ CÀO CỦA YOFUKASHI NO UTA ===");
        for (int i = 0; i < Math.min(10, chapters.size()); i++) {
            ChapterResponse ch = chapters.get(i);
            System.out.printf(" - Chap %s: %s (chapterId=%s, storage=%s)%n",
                    ch.getChapterNumber(), ch.getTitle(), ch.getId(), ch.getStorageType());
        }
        assertFalse(chapters.isEmpty(), "Danh sách chương rỗng!");

        // Kiểm tra chi tiết toàn bộ trang của Chap 1 (Xóa cache trang cũ nếu thiếu để tải full chap từ MangaDex@Home)
        ChapterResponse chap1 = chapters.stream()
                .filter(c -> "1".equals(c.getChapterNumber()) || "1.0".equals(c.getChapterNumber()))
                .findFirst()
                .orElse(chapters.getFirst());

        jdbcTemplate.update("DELETE FROM chapter_pages WHERE chapter_id = ?", chap1.getId());
        ReaderChapterResponse readerChap1 = mangaDexService.getChapterPages(chap1.getId());
        System.out.printf("=== KIỂM TRA CHAP %s (%s): Tổng số trang = %d | Nguồn = %s ===%n",
                readerChap1.chapterNumber(), readerChap1.title(), readerChap1.totalPages(), readerChap1.source());
        for (int i = 0; i < Math.min(5, readerChap1.pages().size()); i++) {
            var p = readerChap1.pages().get(i);
            System.out.printf("   Trang %d: %s (%dx%d)%n", p.pageNumber(), p.imageUrl(), p.width(), p.height());
        }
        assertTrue(readerChap1.totalPages() > 10, "Chap 1 phải là full chap (> 10 trang), thực tế: " + readerChap1.totalPages());
    }

    @Test
    void seedMangaFromMangaDex() {
        String ids = System.getProperty("seed.mangadex.ids", DEFAULT_IDS);
        int chapters = Integer.parseInt(System.getProperty("seed.mangadex.chapters", "30"));
        int mirror = Integer.parseInt(System.getProperty("seed.mangadex.mirror", "0"));

        for (String id : ids.split(",")) {
            MangaDexImportResponse result = mangaDexService.importManga(MangaDexImportRequest.builder()
                    .urlOrId(id.trim())
                    .language("vi")
                    .maxChapters(chapters)
                    .mirrorChapters(mirror)
                    .build());
            System.out.printf("[SEED] %s -> mangaId=%s, chapters=%d (%s), skipped=%d, mirrored=%d, cover=%s, tags=%s, warnings=%s%n",
                    result.getTitle(), result.getMangaId(), result.getChaptersImported(), result.getChapterLanguage(),
                    result.getChaptersSkipped(), result.getChaptersMirrored(), result.getCoverImageUrl(),
                    result.getTags(), result.getWarnings());
            assertNotNull(result.getMangaId());
            assertTrue(result.getChaptersImported() > 0, "Không cào được chương nào cho " + id);
        }
    }
}
