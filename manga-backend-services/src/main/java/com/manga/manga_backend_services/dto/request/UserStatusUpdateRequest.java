package com.manga.manga_backend_services.dto.request;

import lombok.Data;

@Data
public class UserStatusUpdateRequest {
    private Boolean isBanned;
    private Boolean isMuted;
    private Integer muteDays;
    private String reason;
}
