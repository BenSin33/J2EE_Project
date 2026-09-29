package com.manga.manga_backend_services.dto.request;

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
public class UpdateReadingHistoryRequest {
    @NotNull(message = "Manga ID is required")
    private UUID mangaId;

    @NotNull(message = "Chapter ID is required")
    private UUID lastChapterId;

    private Integer lastPage;
}
