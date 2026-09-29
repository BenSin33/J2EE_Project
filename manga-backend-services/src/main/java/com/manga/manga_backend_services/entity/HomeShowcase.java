package com.manga.manga_backend_services.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "home_showcases")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomeShowcase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "manga_id", nullable = false)
    private UUID mangaId;

    @Column(name = "display_section", nullable = false, length = 50)
    private String displaySection;

    @Column(name = "banner_custom_url", length = 500)
    private String bannerCustomUrl;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_by")
    private UUID createdBy;
}
