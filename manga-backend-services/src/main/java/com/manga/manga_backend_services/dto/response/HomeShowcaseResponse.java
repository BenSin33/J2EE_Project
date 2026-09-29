package com.manga.manga_backend_services.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class HomeShowcaseResponse {
    private UUID id;
    private UUID mangaId;
    private String displaySection;
    private String bannerCustomUrl;
    private Integer sortOrder;
    private Boolean isActive;
    private UUID createdBy;

    private MangaResponse manga;
}
