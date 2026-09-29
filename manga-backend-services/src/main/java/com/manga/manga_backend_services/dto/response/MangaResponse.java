package com.manga.manga_backend_services.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MangaResponse {
    private UUID id;
    private UUID mangadexId;
    private UUID uploaderId;
    private UUID groupId;
    private String title;
    private Object altTitles;
    private String description;
    private String coverImageUrl;
    private String originalLanguage;
    private String originType;
    private String status;
    private String contentRating;
    private Long viewsCount;
    private Integer bookmarksCount;
    private BigDecimal ratingScore;
    private Integer ratingCount;
    private String approvalStatus;
    private String rejectionReason;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    // Joined relations for client consumption
    private ScanlationGroupResponse group;
    private List<AuthorResponse> authors;
    private List<TagResponse> tags;
}
