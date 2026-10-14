package com.manga.manga_backend_services.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MangaDexImportRequest {
    @NotBlank(message = "urlOrId must not be blank")
    private String urlOrId;

    @Builder.Default
    private String language = "vi";

    @Builder.Default
    private int maxChapters = 50;
}
