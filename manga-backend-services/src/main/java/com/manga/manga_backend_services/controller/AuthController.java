package com.manga.manga_backend_services.controller;

import com.manga.manga_backend_services.dto.request.ForgotPasswordRequest;
import com.manga.manga_backend_services.dto.request.GoogleLoginRequest;
import com.manga.manga_backend_services.dto.request.LoginRequest;
import com.manga.manga_backend_services.dto.request.RegisterRequest;
import com.manga.manga_backend_services.dto.request.ResetPasswordRequest;
import com.manga.manga_backend_services.dto.response.AuthResponse;
import com.manga.manga_backend_services.entity.User;
import com.manga.manga_backend_services.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication & Security", description = "APIs Đăng nhập, Đăng ký, Đăng nhập Google, và Quên mật khẩu qua Email")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản mới và gửi email chào mừng")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập bằng Username hoặc Email")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/google")
    @Operation(summary = "Đăng nhập bằng tài khoản Google (OAuth2)")
    public ResponseEntity<AuthResponse> loginWithGoogle(
            @RequestBody GoogleLoginRequest request
    ) {
        return ResponseEntity.ok(authService.loginWithGoogle(request));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Yêu cầu mã OTP đặt lại mật khẩu gửi về Email")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {
        return ResponseEntity.ok(authService.forgotPassword(request));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Xác nhận mã OTP và đổi mật khẩu mới")
    public ResponseEntity<Map<String, String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        return ResponseEntity.ok(authService.resetPassword(request));
    }

    @GetMapping("/me")
    @Operation(summary = "Lấy thông tin người dùng hiện tại (kèm số dư xu và gói VIP)")
    public ResponseEntity<AuthResponse> getCurrentUser(
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(AuthResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .avatarUrl(user.getAvatarUrl())
                .coins(user.getCoins() != null ? user.getCoins() : 0L)
                .isVip(user.getIsVip() != null ? user.getIsVip() : false)
                .authProvider(user.getAuthProvider() != null ? user.getAuthProvider() : "LOCAL")
                .build());
    }
}
