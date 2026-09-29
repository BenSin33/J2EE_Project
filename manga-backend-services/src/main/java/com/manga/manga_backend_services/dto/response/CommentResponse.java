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
public class CommentResponse {
    private UUID id;
    private UUID userId;
    private UUID mangaId;
    private UUID chapterId;
    private UUID parentId;
    private String content;
    private Boolean isSpoiler;
    private Boolean isHidden;
    private OffsetDateTime createdAt;

    private UserResponse user;
    private List<CommentResponse> replies;
}
