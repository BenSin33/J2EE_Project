package com.manga.manga_backend_services.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploaderStatsResponse {
    private String role;
    private boolean admin;
    /** Chỉ ADMIN được dùng crawler MangaDex (theo SecurityConfig) */
    private boolean canImportMangaDex;
    private boolean cloudinaryEnabled;
    private long totalMangas;
    private long localMangas;
    private long mangadexMangas;
    private long pendingMangas;
    private long rejectedMangas;
    private long totalChapters;
    private long draftChapters;
}
