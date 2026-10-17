package com.manga.manga_backend_services.dto.response;

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
public class MangaDexImportResponse {
    private UUID mangaId;
    private UUID mangadexId;
    private String title;
    private String coverImageUrl;
    private boolean coverOnCloudinary;
    /** Ngôn ngữ chương thực sự được cào (có thể fallback từ vi sang en) */
    private String chapterLanguage;
    private int chaptersImported;
    /** Số chương bị bỏ qua: trùng số chương, link ngoài (externalUrl) hoặc không có trang */
    private int chaptersSkipped;
    private int chaptersMirrored;
    private List<String> tags;
    private List<String> authors;
    private List<String> warnings;
    private String message;
}
