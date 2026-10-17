package com.manga.manga_backend_services.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MangaDexSearchResult {
    private UUID mangadexId;
    private String title;
    private String description;
    private String coverImageUrl;
    private String status;
    private String originalLanguage;
    private String contentRating;
    private String authorName;
    private List<String> tags;
    private List<String> availableLanguages;
    /** UUID truyện trong hệ thống nếu bộ này đã được cào trước đó, null nếu chưa */
    private UUID importedMangaId;
}
