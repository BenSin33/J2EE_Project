package com.manga.manga_backend_services.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMangaRequest {
    private String title;
    private Object altTitles;
    private String description;
    private String coverImageUrl;
    private String originalLanguage;
    private String originType;
    private String status;
    private String contentRating;
    private String approvalStatus;
    private String rejectionReason;

    private UUID groupId;
    private List<UUID> authorIds;
    private List<UUID> tagIds;
}
