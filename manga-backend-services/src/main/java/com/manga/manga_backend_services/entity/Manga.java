package com.manga.manga_backend_services.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "mangas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Manga {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "mangadex_id", unique = true)
    private UUID mangadexId;

    @Column(name = "uploader_id")
    private UUID uploaderId;

    @Column(name = "group_id")
    private UUID groupId;

    @Column(nullable = false)
    private String title;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "alt_titles", columnDefinition = "jsonb")
    private Object altTitles;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "cover_image_url", length = 500)
    private String coverImageUrl;

    @Column(name = "original_language", length = 10)
    @Builder.Default
    private String originalLanguage = "ja";

    @Column(name = "origin_type", length = 20)
    @Builder.Default
    private String originType = "manga";

    @Column(length = 20)
    @Builder.Default
    private String status = "ongoing";

    @Column(name = "content_rating", length = 20)
    @Builder.Default
    private String contentRating = "safe";

    @Column(name = "views_count")
    @Builder.Default
    private Long viewsCount = 0L;

    @Column(name = "bookmarks_count")
    @Builder.Default
    private Integer bookmarksCount = 0;

    @Column(name = "rating_score", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal ratingScore = BigDecimal.ZERO;

    @Column(name = "rating_count")
    @Builder.Default
    private Integer ratingCount = 0;

    @Column(name = "approval_status", length = 20)
    @Builder.Default
    private String approvalStatus = "approved";

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}