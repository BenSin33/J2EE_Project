package com.manga.manga_backend_services.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "comments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "manga_id", nullable = false)
    private UUID mangaId;

    @Column(name = "chapter_id")
    private UUID chapterId;

    @Column(name = "parent_id")
    private UUID parentId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "is_spoiler")
    @Builder.Default
    private Boolean isSpoiler = false;

    @Column(name = "is_hidden")
    @Builder.Default
    private Boolean isHidden = false;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}
