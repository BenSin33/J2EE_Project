package com.manga.manga_backend_services.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Sửa thông tin chương LOCAL; trường null thì giữ nguyên */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploaderChapterUpdateRequest {
    private String chapterNumber;
    private String volume;
    private String title;
    /** published | draft */
    private String status;
}
