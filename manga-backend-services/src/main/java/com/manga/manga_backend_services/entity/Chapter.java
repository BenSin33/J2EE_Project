package com.manga.manga_backend_services.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "chapters")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Chapter {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "mangadex_id", unique = true)
    private UUID mangadexId;

    @Column(name = "manga_id", nullable = false)
    private UUID mangaId;

    @Column(name = "uploader_id")
    private UUID uploaderId;

    @Column(name = "group_id")
    private UUID groupId;

    @Column(length = 20)
    private String volume;

    @Column(name = "chapter_number", length = 50)
    private String chapterNumber;

    @Column(length = 255)
    private String title;

    @Column(name = "translated_language", length = 10)
    @Builder.Default
    private String translatedLanguage = "vi";

    @Column(name = "storage_type", length = 20)
    @Builder.Default
    private String storageType = "mangadex_at_home";

    @Column(name = "mangadex_hash", length = 100)
    private String mangadexHash;

    @Column(name = "pinned_comment", columnDefinition = "TEXT")
    private String pinnedComment;

    @Column(length = 20)
    @Builder.Default
    private String status = "published";

    @Column(name = "publish_at")
    private OffsetDateTime publishAt;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (publishAt == null) {
            publishAt = now;
        }
    }
}
