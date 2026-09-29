package com.manga.manga_backend_services.dto.mangadex;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ChapterAttributesDto {
    private String volume;
    private String chapter;
    private String title;
    private String translatedLanguage;
    private String externalUrl;
    private String publishAt;
    private String readableAt;
    private String createdAt;
    private String updatedAt;
    private Integer pages;
}
