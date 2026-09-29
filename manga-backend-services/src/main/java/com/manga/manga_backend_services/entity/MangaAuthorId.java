package com.manga.manga_backend_services.entity;

import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class MangaAuthorId implements Serializable {
    private UUID mangaId;
    private UUID authorId;
    private String role;
}
