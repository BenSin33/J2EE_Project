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
public class UploaderChapterResponse {
    private UUID id;
    private UUID mangaId;
    private UUID mangadexId;
    private String volume;
    private String chapterNumber;
    private String title;
    private String translatedLanguage;
    private String storageType;
    private String status;
    private long pageCount;
    /** Ảnh trang đầu, dùng làm thumbnail */
    private String previewUrl;
    private OffsetDateTime publishAt;
    private OffsetDateTime createdAt;
}
