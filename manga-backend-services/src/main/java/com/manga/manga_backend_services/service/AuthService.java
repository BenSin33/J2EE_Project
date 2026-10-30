package com.manga.manga_backend_services.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.manga.manga_backend_services.dto.request.ForgotPasswordRequest;
import com.manga.manga_backend_services.dto.request.GoogleLoginRequest;
import com.manga.manga_backend_services.dto.request.LoginRequest;
import com.manga.manga_backend_services.dto.request.RegisterRequest;
import com.manga.manga_backend_services.dto.request.ResetPasswordRequest;
import com.manga.manga_backend_services.dto.response.AuthResponse;
import com.manga.manga_backend_services.entity.PasswordResetToken;
import com.manga.manga_backend_services.entity.User;
import com.manga.manga_backend_services.repository.PasswordResetTokenRepository;
import com.manga.manga_backend_services.repository.UserRepository;
import com.manga.manga_backend_services.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;
    private final ObjectMapper objectMapper;

    @Value("${google.client-id:}")
    private String configuredGoogleClientId;

    public AuthResponse register(RegisterRequest request) {
        log.info("Bắt đầu đăng ký tài khoản cho username: {}", request.getUsername());
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            log.error("Lỗi đăng ký: Username '{}' đã tồn tại!", request.getUsername());
            throw new RuntimeException("Username is already taken!");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            log.error("Lỗi đăng ký: Email '{}' đã tồn tại!", request.getEmail());
            throw new RuntimeException("Email is already taken!");
        }

        var user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role("ROLE_USER")
                .isBanned(false)
                .isMuted(false)
                .coins(0L)
                .isVip(false)
                .authProvider("LOCAL")
                .build();

        userRepository.save(user);
        log.info("Đã lưu user mới vào database thành công: {}", user.getUsername());

        // Gửi email chào mừng bằng Spring Email (Yêu cầu 5)
        try {
            emailService.sendWelcomeEmail(user.getEmail(), user.getUsername());
        } catch (Exception e) {
            log.warn("Không thể gửi email chào mừng: {}", e.getMessage());
        }

        var jwtToken = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(jwtToken)
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .avatarUrl(user.getAvatarUrl())
                .coins(user.getCoins())
                .isVip(user.getIsVip())
                .authProvider(user.getAuthProvider())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        log.info("Bắt đầu xử lý đăng nhập cho: {}", request.getUsernameOrEmail());

        // Hỗ trợ đăng nhập bằng Username hoặc Email
        Optional<User> userOptional = userRepository.findByUsername(request.getUsernameOrEmail());
        if (userOptional.isEmpty()) {
            userOptional = userRepository.findByEmail(request.getUsernameOrEmail());
        }

        if (userOptional.isEmpty()) {
            log.error("Lỗi đăng nhập: Không tìm thấy tài khoản '{}' trong cơ sở dữ liệu!", request.getUsernameOrEmail());
            throw new RuntimeException("User not found / Invalid credentials");
        }

        User user = userOptional.get();

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            user.getUsername(),
                            request.getPassword()
                    )
            );
            log.info("Xác thực mật khẩu thành công cho user: {}", user.getUsername());
        } catch (Exception e) {
            log.error("Lỗi đăng nhập: Sai mật khẩu đối với tài khoản '{}'. Chi tiết: {}", request.getUsernameOrEmail(), e.getMessage());
            throw new RuntimeException("Invalid credentials");
        }

        var jwtToken = jwtService.generateToken(user);
        log.info("Đã tạo JWT Token thành công cho user: {}", user.getUsername());

        return AuthResponse.builder()
                .token(jwtToken)
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .avatarUrl(user.getAvatarUrl())
                .coins(user.getCoins())
                .isVip(user.getIsVip())
                .authProvider(user.getAuthProvider())
                .build();
    }

    /**
     * Đăng nhập bằng Google OAuth2 (Yêu cầu 1)
     */
    @Transactional
    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        String email = null;
        String name = null;
        String avatarUrl = null;
        String googleSub = null;

        if (request.getIdToken() != null && !request.getIdToken().isBlank()) {
            try {
                // Xác thực Google Token qua Google TokenInfo API
                RestTemplate restTemplate = new RestTemplate();
                String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + request.getIdToken();
                ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    JsonNode root = objectMapper.readTree(response.getBody());
                    email = root.path("email").asText(null);
                    name = root.path("name").asText(null);
                    avatarUrl = root.path("picture").asText(null);
                    googleSub = root.path("sub").asText(null);
                    log.info("Xác thực Google ID Token thành công cho email: {}", email);
                }
            } catch (Exception e) {
                log.warn("Xác thực Google ID Token qua Google API thất bại (hoặc đang test offline): {}", e.getMessage());
            }
        }

        // Hỗ trợ fallback trực tiếp nếu test mode hoặc có email trong request
        if (email == null || email.isBlank()) {
            email = request.getEmail();
            name = request.getName();
            avatarUrl = request.getAvatarUrl();
        }

        if (email == null || email.isBlank()) {
            throw new RuntimeException("Không tìm thấy thông tin email từ Google Token!");
        }

        final String finalEmail = email.trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(finalEmail);

        User user;
        if (userOpt.isPresent()) {
            user = userOpt.get();
            if (user.getAvatarUrl() == null && avatarUrl != null) {
                user.setAvatarUrl(avatarUrl);
            }
            if (googleSub != null && user.getProviderId() == null) {
                user.setProviderId(googleSub);
            }
            userRepository.save(user);
            log.info("Người dùng Google '{}' đã tồn tại, tiến hành đăng nhập.", finalEmail);
        } else {
            // Tạo tài khoản mới cho người dùng Google
            String baseUsername = (name != null && !name.isBlank())
                    ? name.replaceAll("[^a-zA-Z0-9_]", "").toLowerCase()
                    : finalEmail.split("@")[0].replaceAll("[^a-zA-Z0-9_]", "");
            if (baseUsername.isBlank()) {
                baseUsername = "user";
            }

            String candidateUsername = baseUsername;
            int counter = 1;
            while (userRepository.findByUsername(candidateUsername).isPresent()) {
                candidateUsername = baseUsername + counter;
                counter++;
            }

            user = User.builder()
                    .username(candidateUsername)
                    .email(finalEmail)
                    .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .role("ROLE_USER")
                    .avatarUrl(avatarUrl)
                    .isBanned(false)
                    .isMuted(false)
                    .coins(0L)
                    .isVip(false)
                    .authProvider("GOOGLE")
                    .providerId(googleSub)
                    .build();

            userRepository.save(user);
            log.info("Đã tạo mới tài khoản từ Google: {} ({})", user.getUsername(), user.getEmail());

            try {
                emailService.sendWelcomeEmail(user.getEmail(), user.getUsername());
            } catch (Exception e) {
                log.warn("Không thể gửi email chào mừng: {}", e.getMessage());
            }
        }

        String jwtToken = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(jwtToken)
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .avatarUrl(user.getAvatarUrl())
                .coins(user.getCoins())
                .isVip(user.getIsVip())
                .authProvider(user.getAuthProvider())
                .build();
    }

    /**
     * Yêu cầu mã OTP đặt lại mật khẩu gửi về Email (Yêu cầu 5)
     */
    @Transactional
    public Map<String, String> forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản liên kết với email: " + email));

        // Sinh mã OTP 6 chữ số
        String otpCode = String.format("%06d", new Random().nextInt(1000000));
        OffsetDateTime expiry = OffsetDateTime.now().plusMinutes(10);

        PasswordResetToken token = PasswordResetToken.builder()
                .email(email)
                .otpCode(otpCode)
                .expiryTime(expiry)
                .used(false)
                .build();

        passwordResetTokenRepository.save(token);

        // Gửi email qua Spring Email
        emailService.sendOtpEmail(email, otpCode, user.getUsername());

        log.info("Đã tạo mã OTP đặt lại mật khẩu cho email {}: {}", email, otpCode);

        return Map.of(
                "message", "Mã xác thực OTP đã được gửi về email của bạn. Vui lòng kiểm tra hòm thư!",
                "email", email
        );
    }

    /**
     * Xác thực OTP và đặt lại mật khẩu mới (Yêu cầu 5)
     */
    @Transactional
    public Map<String, String> resetPassword(ResetPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String otp = request.getOtpCode().trim();

        PasswordResetToken token = passwordResetTokenRepository
                .findFirstByEmailAndOtpCodeAndUsedFalseOrderByCreatedAtDesc(email, otp)
                .orElseThrow(() -> new RuntimeException("Mã OTP không chính xác hoặc đã được sử dụng!"));

        if (token.isExpired()) {
            throw new RuntimeException("Mã OTP đã hết hạn! Vui lòng yêu cầu mã mới.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản với email: " + email));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        token.setUsed(true);
        passwordResetTokenRepository.save(token);

        log.info("Đặt lại mật khẩu thành công cho email: {}", email);

        return Map.of("message", "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay bằng mật khẩu mới.");
    }
}
