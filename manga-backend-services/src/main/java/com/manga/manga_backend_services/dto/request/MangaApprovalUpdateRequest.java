package com.manga.manga_backend_services.dto.request;

import lombok.Data;

@Data
public class MangaApprovalUpdateRequest {
    private String approvalStatus; // approved, rejected, pending, hidden
    private String rejectionReason;
}
