package com.manga.manga_backend_services.dto.mangadex;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class MangaAttributesDto {
    private Map<String, String> title;
    private List<Map<String, String>> altTitles;
    private Map<String, String> description;
    private String status;
    private String originalLanguage;
    private String contentRating;
    private List<TagDto> tags;
    private String state;
    private String createdAt;
    private String updatedAt;
}
