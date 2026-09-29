package com.manga.manga_backend_services.dto.mangadex;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.util.UUID;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class RelationshipDto {
    private UUID id;
    private String type;
    private String related;
}
