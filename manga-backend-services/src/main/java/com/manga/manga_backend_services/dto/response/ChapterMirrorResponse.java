package com.manga.manga_backend_services.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChapterMirrorResponse {
    private UUID chapterId;
    private String chapterNumber;
    private int totalPages;
    private int pagesUploaded;
    /** Số trang đã có sẵn trên Cloudinary từ lần chạy trước nên bỏ qua */
    private int pagesSkipped;
    private String message;
}
