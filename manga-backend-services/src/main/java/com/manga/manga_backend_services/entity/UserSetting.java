package com.manga.manga_backend_services.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "user_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSetting {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "reader_theme", length = 20)
    @Builder.Default
    private String readerTheme = "dark";

    @Column(name = "reading_mode", length = 20)
    @Builder.Default
    private String readingMode = "vertical";

    @Column(name = "fit_mode", length = 20)
    @Builder.Default
    private String fitMode = "fit-width";

    @Column(name = "font_size", length = 10)
    @Builder.Default
    private String fontSize = "medium";
}
