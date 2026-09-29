package com.manga.manga_backend_services.entity;

import jakarta.persistence.*;
import lombok.*;

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

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "cover_image_url", length = 500)
    private String coverImageUrl;

    @Column(name = "original_language", length = 10)
    private String originalLanguage;

    @Column(name = "origin_type", length = 20)
    private String originType;

    @Column(length = 20)
    private String status;

    @Column(name = "content_rating", length = 20)
    private String contentRating;

    @Column(name = "views_count")
    private Long viewsCount;

    @Column(name = "bookmarks_count")
    private Integer bookmarksCount;

    @Column(name = "rating_score", precision = 3, scale = 2)
    private BigDecimal ratingScore;

    @Column(name = "rating_count")
    private Integer ratingCount;

    @Column(name = "approval_status", length = 20)
    private String approvalStatus;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private OffsetDateTime updatedAt;
}