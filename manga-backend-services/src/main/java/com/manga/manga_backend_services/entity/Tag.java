package com.manga.manga_backend_services.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "tags")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tag {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "mangadex_id", unique = true)
    private UUID mangadexId;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @Column(name = "group_type", length = 30)
    @Builder.Default
    private String groupType = "genre";
}
