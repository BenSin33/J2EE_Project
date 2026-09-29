package com.manga.manga_backend_services.dto.mangadex;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class MangaDexEntityDto<T> {
    private UUID id;
    private String type;
    private T attributes;
    private List<RelationshipDto> relationships;
}
