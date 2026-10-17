package com.manga.manga_backend_services;

import com.manga.manga_backend_services.dto.request.MangaDexImportRequest;
import com.manga.manga_backend_services.dto.response.MangaDexImportResponse;
import com.manga.manga_backend_services.service.MangaDexService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

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
