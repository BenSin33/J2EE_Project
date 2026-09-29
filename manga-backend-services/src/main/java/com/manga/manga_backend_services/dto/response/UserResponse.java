package com.manga.manga_backend_services.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserResponse {
    private UUID id;
    private String username;
    private String email;
    private String avatarUrl;
    private String role;
    private Boolean isBanned;
    private Boolean isMuted;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
