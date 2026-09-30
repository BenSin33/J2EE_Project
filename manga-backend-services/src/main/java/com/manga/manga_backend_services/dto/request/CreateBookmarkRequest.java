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
public class CreateBookmarkRequest {
    @NotNull(message = "Manga ID is required")
    private UUID mangaId;

    private String folderType; // reading, plan_to_read, completed, re_reading, dropped
}
