package com.manga.manga_backend_services.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "chapter_pages",
    uniqueConstraints = @UniqueConstraint(name = "unique_page_per_chapter", columnNames = {"chapter_id", "page_number"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChapterPage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "chapter_id", nullable = false)
    private UUID chapterId;

    @Column(name = "page_number", nullable = false)
    private Integer pageNumber;

    @Column(name = "image_file_name", nullable = false, length = 255)
    private String imageFileName;

    @Column(name = "data_saver_file_name", length = 255)
    private String dataSaverFileName;

    @Column(name = "s3_origin_url", length = 500)
    private String s3OriginUrl;

    @Column(name = "s3_webp_url", length = 500)
    private String s3WebpUrl;

    private Integer width;

    private Integer height;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}
