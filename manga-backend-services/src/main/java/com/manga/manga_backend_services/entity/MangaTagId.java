package com.manga.manga_backend_services.entity;

import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class MangaTagId implements Serializable {
    private UUID mangaId;
    private UUID tagId;
}
