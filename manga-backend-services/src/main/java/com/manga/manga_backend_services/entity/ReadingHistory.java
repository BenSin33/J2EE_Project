package com.manga.manga_backend_services.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "reading_history",
    uniqueConstraints = @UniqueConstraint(name = "unique_user_manga_history", columnNames = {"user_id", "manga_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReadingHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "manga_id", nullable = false)
    private UUID mangaId;

    @Column(name = "last_chapter_id", nullable = false)
    private UUID lastChapterId;

    @Column(name = "last_page")
    @Builder.Default
    private Integer lastPage = 1;

    @Column(name = "read_at")
    private OffsetDateTime readAt;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        readAt = OffsetDateTime.now();
    }
}
