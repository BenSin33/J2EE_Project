package com.manga.manga_backend_services.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(
                        "/api/auth/**",
                        "/api/internal/**",
                        "/actuator/**",
                        "/v3/api-docs/**",
                        "/swagger-ui/**",
                        "/swagger-ui.html",
                        "/error",
                        "/api/v1/reader-demo/**",
                        "/api/v1/payment/packages",
                        "/api/v1/payment/vnpay-callback",
                        "/api/payment/packages",
                        "/api/payment/vnpay-callback"
                ).permitAll()
                // Nhóm 4 - ROLE_ADMIN: Toàn quyền hệ thống (Đổi Role, Xóa cứng truyện, Cào dữ liệu MangaDex)
                .requestMatchers("/api/v1/crawler/**").hasAnyAuthority("ROLE_ADMIN", "ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/v1/admin/users/*/role").hasAnyAuthority("ROLE_ADMIN", "ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/v1/admin/mangas/**").hasAnyAuthority("ROLE_ADMIN", "ADMIN")
                // Nhóm 3 - ROLE_MODERATOR & ROLE_ADMIN: Kiểm duyệt truyện, xử lý báo cáo vi phạm, quản lý thẻ & kỷ luật (Mute/Ban)
                .requestMatchers("/api/v1/admin/**").hasAnyAuthority("ROLE_ADMIN", "ADMIN", "ROLE_MODERATOR", "MODERATOR")
                // Nhóm 2 - ROLE_UPLOADER (cùng Admin/Mod/User đăng truyện chờ duyệt): Quản lý & đăng tải chương truyện
                .requestMatchers("/api/v1/uploader/**").hasAnyAuthority(
                        "ROLE_UPLOADER", "UPLOADER",
                        "ROLE_MODERATOR", "MODERATOR",
                        "ROLE_ADMIN", "ADMIN",
                        "ROLE_USER", "USER"
                )
                .requestMatchers(org.springframework.http.HttpMethod.GET,
                        "/api/v1/mangas/**",
                        "/api/v1/manga/**",
                        "/api/v1/chapters/**",
                        "/api/v1/mangas/*/comments",
                        "/api/v1/mangas/*/rating"
                ).permitAll()
                // Nhóm 1 - ROLE_USER (Độc giả đã đăng nhập): Tủ sách, Lịch sử đọc, Thông báo, Nạp xu VNPay
                .requestMatchers("/api/v1/me/**", "/api/v1/payment/**", "/api/payment/**").authenticated()
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"Phiên đăng nhập đã hết hạn hoặc chưa đăng nhập.\"}");
                })
            )
            .authenticationProvider(authenticationProvider)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {
        org.springframework.web.cors.CorsConfiguration configuration = new org.springframework.web.cors.CorsConfiguration();
        // Cho phép frontend ở localhost:3000
        configuration.setAllowedOrigins(java.util.List.of("http://localhost:3000"));
        // Cho phép các method cần thiết
        configuration.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        // Cho phép tất cả các header (bao gồm Authorization)
        configuration.setAllowedHeaders(java.util.List.of("*"));
        // Cho phép gửi credentials nếu cần
        configuration.setAllowCredentials(true);

        org.springframework.web.cors.UrlBasedCorsConfigurationSource source = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
