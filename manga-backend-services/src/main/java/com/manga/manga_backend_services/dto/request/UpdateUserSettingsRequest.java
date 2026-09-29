package com.manga.manga_backend_services.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserSettingsRequest {
    private String readerTheme;
    private String readingMode;
    private String fitMode;
    private String fontSize;
}
