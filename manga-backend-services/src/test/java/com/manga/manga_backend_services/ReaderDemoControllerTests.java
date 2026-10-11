package com.manga.manga_backend_services;

import com.manga.manga_backend_services.controller.ReaderDemoController;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import java.util.UUID;
import org.springframework.mock.web.MockHttpSession;
import static org.junit.jupiter.api.Assertions.*;

class ReaderDemoControllerTests {
    private final ReaderDemoController controller = new ReaderDemoController();

    @Test
    void progressResumesLatestPageEvenWhenReadingBackwardsAndIsSessionIsolated() {
        var session = new MockHttpSession();
        assertNull(controller.progress(ReaderDemoController.MANGA_ID, session));
        var last = controller.saveProgress(ReaderDemoController.MANGA_ID,
                new ReaderDemoController.ProgressRequest(ReaderDemoController.CHAPTER_ID, 3), session);
        assertEquals(100.0, last.percentage());
        controller.saveProgress(ReaderDemoController.MANGA_ID,
                new ReaderDemoController.ProgressRequest(ReaderDemoController.CHAPTER_ID, 1), session);
        assertEquals(1, controller.progress(ReaderDemoController.MANGA_ID, session).lastPage());
        assertNull(controller.progress(ReaderDemoController.MANGA_ID, new MockHttpSession()));
    }

    @Test
    void invalidProgressDoesNotOverwriteSavedPosition() {
        var session = new MockHttpSession();
        controller.saveProgress(ReaderDemoController.MANGA_ID,
                new ReaderDemoController.ProgressRequest(ReaderDemoController.CHAPTER_ID, 2), session);
        for (int n : new int[]{0, 4}) {
            assertThrows(ResponseStatusException.class, () -> controller.saveProgress(ReaderDemoController.MANGA_ID,
                    new ReaderDemoController.ProgressRequest(ReaderDemoController.CHAPTER_ID, n), session));
        }
        assertThrows(ResponseStatusException.class, () -> controller.saveProgress(ReaderDemoController.MANGA_ID,
                new ReaderDemoController.ProgressRequest(UUID.randomUUID(), 2), session));
        assertEquals(2, controller.progress(ReaderDemoController.MANGA_ID, session).lastPage());
    }

    @Test
    void fixtureHasOrderedPagesWithLoadableImagePaths() {
        var chapter = controller.pages(ReaderDemoController.CHAPTER_ID);
        assertEquals(3, chapter.totalPages());
        assertEquals(ReaderDemoController.MANGA_ID, chapter.mangaId());
        for (int n = 1; n <= chapter.totalPages(); n++) {
            var page = chapter.pages().get(n - 1);
            assertEquals(n, page.pageNumber());
            assertEquals("/api/v1/reader-demo/images/" + n, page.imageUrl());
            assertTrue(controller.image(n).contains("PAGE " + n + " / 3"));
        }
    }

    @Test
    void unknownChapterAndPagesAreUnavailable() {
        assertEquals(404, assertThrows(ResponseStatusException.class,
                () -> controller.pages(UUID.randomUUID())).getStatusCode().value());
        for (int n : new int[]{0, 4}) {
            assertEquals(404, assertThrows(ResponseStatusException.class,
                    () -> controller.image(n)).getStatusCode().value());
        }
    }
}
