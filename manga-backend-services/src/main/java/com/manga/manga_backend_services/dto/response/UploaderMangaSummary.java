package com.manga.manga_backend_services.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploaderMangaSummary {
    private UUID id;
    private UUID mangadexId;
    private String title;
    private String coverImageUrl;
    private String status;
    private String approvalStatus;
    private String rejectionReason;
    /** LOCAL hoặc MANGADEX */
    private String source;
    private long chapterCount;
    private OffsetDateTime updatedAt;
}
