package com.manga.manga_backend_services.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.manga.manga_backend_services.dto.request.ForgotPasswordRequest;
import com.manga.manga_backend_services.dto.request.GoogleLoginRequest;
import com.manga.manga_backend_services.dto.request.ResetPasswordRequest;
import com.manga.manga_backend_services.dto.response.AuthResponse;
import com.manga.manga_backend_services.entity.PasswordResetToken;
import com.manga.manga_backend_services.entity.User;
import com.manga.manga_backend_services.repository.PasswordResetTokenRepository;
import com.manga.manga_backend_services.repository.UserRepository;
import com.manga.manga_backend_services.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class AuthEmailServiceTests {

    private UserRepository userRepository;
    private PasswordResetTokenRepository passwordResetTokenRepository;
    private PasswordEncoder passwordEncoder;
    private JwtService jwtService;
    private AuthenticationManager authenticationManager;
    private EmailService emailService;
    private ObjectMapper objectMapper;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordResetTokenRepository = mock(PasswordResetTokenRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        jwtService = mock(JwtService.class);
        authenticationManager = mock(AuthenticationManager.class);
        emailService = mock(EmailService.class);
        objectMapper = new ObjectMapper();

        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password_123");
        when(jwtService.generateToken(any(User.class))).thenReturn("mock_jwt_token_xyz");

        authService = new AuthService(
                userRepository,
                passwordResetTokenRepository,
                passwordEncoder,
                jwtService,
                authenticationManager,
                emailService,
                objectMapper
        );
    }

    @Test
    void testGoogleLoginCreatesNewUser() {
        GoogleLoginRequest req = GoogleLoginRequest.builder()
                .email("googleuser@gmail.com")
                .name("Google User")
                .avatarUrl("https://example.com/avatar.jpg")
                .build();

        when(userRepository.findByEmail("googleuser@gmail.com")).thenReturn(Optional.empty());
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        AuthResponse resp = authService.loginWithGoogle(req);

        assertNotNull(resp);
        assertEquals("googleuser@gmail.com", resp.getEmail());
        assertEquals("GOOGLE", resp.getAuthProvider());
        assertEquals("mock_jwt_token_xyz", resp.getToken());
        verify(userRepository).save(any(User.class));
        verify(emailService).sendWelcomeEmail(eq("googleuser@gmail.com"), anyString());
    }

    @Test
    void testForgotPasswordGeneratesOtpAndSendsEmail() {
        String email = "reader@example.com";
        User user = User.builder()
                .id(UUID.randomUUID())
                .username("reader")
                .email(email)
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        var result = authService.forgotPassword(new ForgotPasswordRequest(email));

        assertNotNull(result);
        assertTrue(result.containsKey("message"));
        verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
        verify(emailService).sendOtpEmail(eq(email), anyString(), eq("reader"));
    }

    @Test
    void testResetPasswordSuccess() {
        String email = "reader@example.com";
        String otp = "123456";

        User user = User.builder()
                .id(UUID.randomUUID())
                .username("reader")
                .email(email)
                .passwordHash("old_pass")
                .build();

        PasswordResetToken token = PasswordResetToken.builder()
                .email(email)
                .otpCode(otp)
                .expiryTime(OffsetDateTime.now().plusMinutes(5))
                .used(false)
                .build();

        when(passwordResetTokenRepository.findFirstByEmailAndOtpCodeAndUsedFalseOrderByCreatedAtDesc(email, otp))
                .thenReturn(Optional.of(token));
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        ResetPasswordRequest req = ResetPasswordRequest.builder()
                .email(email)
                .otpCode(otp)
                .newPassword("new_secret_pass_123")
                .build();

        var result = authService.resetPassword(req);

        assertNotNull(result);
        assertTrue(token.getUsed());
        assertEquals("hashed_password_123", user.getPasswordHash());
        verify(userRepository).save(user);
        verify(passwordResetTokenRepository).save(token);
    }
}
