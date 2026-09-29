package com.manga.manga_backend_services.dto.mangadex;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class MangaDexResponse<T> {
    private String result;
    private String response;
    private List<MangaDexEntityDto<T>> data;
    private int limit;
    private int offset;
    private int total;
}
