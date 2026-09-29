package com.manga.manga_backend_services.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "manga_tags")
@IdClass(MangaTagId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MangaTag {

    @Id
    @Column(name = "manga_id")
    private UUID mangaId;

    @Id
    @Column(name = "tag_id")
    private UUID tagId;
}
