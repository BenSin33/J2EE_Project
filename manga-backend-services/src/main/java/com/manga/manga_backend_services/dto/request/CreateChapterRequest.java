package com.manga.manga_backend_services.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateChapterRequest {
    private UUID mangadexId;

    @NotNull(message = "Manga ID is required")
    private UUID mangaId;

    private UUID groupId;
    private String volume;

    @NotBlank(message = "Chapter number is required")
    private String chapterNumber;

    private String title;
    private String translatedLanguage;
    private String storageType;
    private String mangadexHash;
    private String pinnedComment;
}
