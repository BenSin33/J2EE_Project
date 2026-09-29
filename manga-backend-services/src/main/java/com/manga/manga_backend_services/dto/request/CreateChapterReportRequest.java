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
public class CreateChapterReportRequest {
    @NotNull(message = "Chapter ID is required")
    private UUID chapterId;

    @NotBlank(message = "Report type is required")
    private String reportType;

    private String description;
}
