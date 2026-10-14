package com.manga.manga_backend_services.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
}
