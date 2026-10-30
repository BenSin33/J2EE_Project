package com.manga.manga_backend_services.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoogleLoginRequest {
    /**
     * ID Token hoặc Credential nhận được từ Google Identity Services
     */
    private String idToken;

    /**
     * Dùng khi test trực tiếp hoặc fallback
     */
    private String email;
    private String name;
    private String avatarUrl;
}
