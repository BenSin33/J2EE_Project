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
public class MangaDexImportResponse {
    private UUID mangaId;
    private UUID mangadexId;
    private String title;
    private String coverImageUrl;
    private int chaptersImported;
    private String message;
}
