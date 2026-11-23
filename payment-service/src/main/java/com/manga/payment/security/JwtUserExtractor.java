package com.manga.payment.security;

import com.manga.payment.client.CoreUserClient;
import com.manga.payment.dto.PaymentDtos.CoreUserDto;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.security.Key;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtUserExtractor {

    @Value("${application.security.jwt.secret-key:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}")
    private String secretKey;

    private final CoreUserClient coreUserClient;

    public record AuthenticatedUser(UUID id, String username) {}

    public AuthenticatedUser requireUser(String authorizationHeader, HttpServletResponse response) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bạn cần đăng nhập để thực hiện giao dịch.");
        }
        String token = authorizationHeader.substring(7);
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSignInKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            String username = claims.getSubject();
            String userIdClaim = claims.get("userId", String.class);
            if (userIdClaim != null && !userIdClaim.isBlank()) {
                return new AuthenticatedUser(UUID.fromString(userIdClaim), username);
            }
            if (username == null || username.isBlank()) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token không hợp lệ.");
            }
            CoreUserDto user = coreUserClient.getUserByUsername(username);
            if (user == null || user.id() == null) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Không tìm thấy tài khoản.");
            }
            return new AuthenticatedUser(user.id(), user.username());
        } catch (ExpiredJwtException e) {
            response.setHeader("X-JWT-Expired", "true");
            response.setHeader("Access-Control-Expose-Headers", "X-JWT-Expired");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Phiên đăng nhập đã hết hạn.");
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token không hợp lệ: " + e.getMessage());
        }
    }

    private Key getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}

