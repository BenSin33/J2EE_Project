package com.manga.manga_backend_services.dto.response;

import java.util.List;
import java.util.UUID;

/** Shared reader contract: page numbers start at 1; image URLs are ready to load. */
public record ReaderChapterResponse(
        UUID mangaId, UUID chapterId, String title, String chapterNumber,
        String source, int totalPages, List<Page> pages) {
    public record Page(int pageNumber, String imageUrl, int width, int height) {}
}
