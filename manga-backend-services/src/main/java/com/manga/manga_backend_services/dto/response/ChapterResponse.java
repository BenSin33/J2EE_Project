package com.manga.manga_backend_services.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChapterResponse {
    private UUID id;
    private UUID mangadexId;
    private UUID mangaId;
    private UUID uploaderId;
    private UUID groupId;
    private String volume;
    private String chapterNumber;
    private String title;
    private String translatedLanguage;
    private String storageType;
    private String mangadexHash;
    private String pinnedComment;
    private String status;
    private OffsetDateTime publishAt;
    private OffsetDateTime createdAt;

    private List<ChapterPageResponse> pages;
}
