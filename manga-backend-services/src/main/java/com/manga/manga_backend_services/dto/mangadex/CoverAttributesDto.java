package com.manga.manga_backend_services.dto.mangadex;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class CoverAttributesDto {
    private String volume;
    private String fileName;
    private String description;
    private String locale;
}
