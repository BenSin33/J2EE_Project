package com.manga.manga_backend_services.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "manga_authors")
@IdClass(MangaAuthorId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MangaAuthor {

    @Id
    @Column(name = "manga_id")
    private UUID mangaId;

    @Id
    @Column(name = "author_id")
    private UUID authorId;

    @Id
    @Column(length = 20)
    @Builder.Default
    private String role = "author";
}
