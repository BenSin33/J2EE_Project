package com.manga.manga_backend_services.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** Tạo / sửa truyện nguồn LOCAL từ Uploader Dashboard */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploaderMangaRequest {
    @NotBlank(message = "Tên truyện không được để trống")
    @Size(max = 255, message = "Tên truyện tối đa 255 ký tự")
    private String title;

    @Builder.Default
    private List<String> altTitles = new ArrayList<>();

    @Size(max = 10000, message = "Mô tả tối đa 10000 ký tự")
    private String description;

    /** ongoing | completed | hiatus | cancelled */
    @Builder.Default
    private String status = "ongoing";

    @Builder.Default
    private String originalLanguage = "ja";

    /** manga | manhwa | manhua */
    @Builder.Default
    private String originType = "manga";

    /** safe | suggestive | erotica */
    @Builder.Default
    private String contentRating = "safe";

    @Builder.Default
    private List<UUID> tagIds = new ArrayList<>();

    @Builder.Default
    private List<String> authorNames = new ArrayList<>();

    @Builder.Default
    private List<String> artistNames = new ArrayList<>();
}
