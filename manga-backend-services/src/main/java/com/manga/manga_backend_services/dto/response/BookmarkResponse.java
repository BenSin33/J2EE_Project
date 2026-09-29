package com.manga.manga_backend_services.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BookmarkResponse {
    private UUID id;
    private UUID userId;
    private UUID mangaId;
    private String folderType;
    private OffsetDateTime createdAt;

    private MangaResponse manga;
}
