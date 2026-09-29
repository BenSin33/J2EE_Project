package com.manga.manga_backend_services.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
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
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChapterPageResponse {
    private UUID id;
    private UUID chapterId;
    private Integer pageNumber;
    private String imageFileName;
    private String dataSaverFileName;
    private String s3OriginUrl;
    private String s3WebpUrl;
    private Integer width;
    private Integer height;
    private OffsetDateTime createdAt;
}
