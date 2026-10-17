package com.manga.manga_backend_services.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MangaDexImportRequest {
    @NotBlank(message = "urlOrId must not be blank")
    private String urlOrId;

    @Builder.Default
    private String language = "vi";

    @Builder.Default
    private Integer maxChapters = 50;

    /** Upload ảnh bìa lên Cloudinary (chỉ có tác dụng khi đã cấu hình Cloudinary) */
    @Builder.Default
    private Boolean uploadCover = true;

    /** Số chương đầu tiên sẽ được tải trang ảnh và upload lên Cloudinary ngay khi cào (0 = không) */
    @Builder.Default
    private Integer mirrorChapters = 0;
}
