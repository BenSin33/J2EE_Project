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
public class CreateCommentRequest {
    @NotNull(message = "Manga ID is required")
    private UUID mangaId;

    private UUID chapterId;
    private UUID parentId;

    @NotBlank(message = "Comment content cannot be blank")
    private String content;

    private Boolean isSpoiler;
}
