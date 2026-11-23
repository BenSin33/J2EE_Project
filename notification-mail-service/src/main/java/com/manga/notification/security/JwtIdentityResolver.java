package com.manga.notification.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.security.Key;
import java.util.Map;
import java.util.UUID;

@Component
public class JwtIdentityResolver {

    @Value("${application.security.jwt.secret-key:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}")
    private String secretKey;

    private final NamedParameterJdbcTemplate db;

    public JwtIdentityResolver(NamedParameterJdbcTemplate db) {
        this.db = db;
    }

    public UUID requireUserId(String authorizationHeader, HttpServletResponse response) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bạn cần đăng nhập để xem thông báo.");
        }
        String token = authorizationHeader.substring(7);
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSignInKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            String userIdClaim = claims.get("userId", String.class);
            if (userIdClaim != null && !userIdClaim.isBlank()) {
                return UUID.fromString(userIdClaim);
            }

            String username = claims.getSubject();
            if (username == null || username.isBlank()) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token không hợp lệ.");
            }
            var rows = db.queryForList("select id, is_banned from users where username = :username", Map.of("username", username));
            if (rows.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Không tìm thấy người dùng.");
            }
            if (Boolean.TRUE.equals(rows.getFirst().get("is_banned"))) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản đang bị khóa.");
            }
            return (UUID) rows.getFirst().get("id");
        } catch (ExpiredJwtException e) {
            response.setHeader("X-JWT-Expired", "true");
            response.setHeader("Access-Control-Expose-Headers", "X-JWT-Expired");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Phiên đăng nhập đã hết hạn.");
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token không hợp lệ.");
        }
    }

    private Key getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}

