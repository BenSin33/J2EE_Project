package com.manga.manga_backend_services.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminStatsResponse {
    private long totalMangas;
    private long totalChapters;
    private long totalUsers;
    private long pendingReports;
    private long pendingMangaApprovals;
    private long totalViews;
    private String storageUsedEstimate;
    private String cdnBandwidthEstimate;
}
