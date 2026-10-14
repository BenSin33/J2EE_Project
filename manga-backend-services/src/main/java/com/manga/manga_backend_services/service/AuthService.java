package com.manga.manga_backend_services.service;

import com.manga.manga_backend_services.dto.request.LoginRequest;
import com.manga.manga_backend_services.dto.request.RegisterRequest;
import com.manga.manga_backend_services.dto.response.AuthResponse;
import com.manga.manga_backend_services.entity.User;
import com.manga.manga_backend_services.repository.UserRepository;
import com.manga.manga_backend_services.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

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
                .build();
        
        userRepository.save(user);
        log.info("Đã lưu user mới vào database thành công: {}", user.getUsername());
        
        var jwtToken = jwtService.generateToken(user);
        
        return AuthResponse.builder()
                .token(jwtToken)
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .avatarUrl(user.getAvatarUrl())
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
                .build();
    }
}
