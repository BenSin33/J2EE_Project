package com.manga.manga_backend_services.controller;

import com.manga.manga_backend_services.entity.User;
import com.manga.manga_backend_services.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Internal Microservice API cho payment-service gọi sang manga-core-service qua OpenFeign.
 */
@RestController
@RequestMapping("/api/internal/users")
@RequiredArgsConstructor
public class InternalUserController {

    private final UserRepository userRepository;

    public record CoreUserDto(UUID id, String username, String email, String role, Long coins, Boolean isVip) {}
    public record CreditUserRequest(Long coinsAdded, Integer vipDays) {}

    @GetMapping("/by-username/{username}")
    public ResponseEntity<CoreUserDto> getByUsername(@PathVariable String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return ResponseEntity.ok(toDto(user));
    }

    @PostMapping("/{userId}/credit")
    @Transactional
    public ResponseEntity<CoreUserDto> creditUser(@PathVariable UUID userId, @RequestBody CreditUserRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        long currentCoins = user.getCoins() != null ? user.getCoins() : 0L;
        long toAdd = req.coinsAdded() != null ? req.coinsAdded() : 0L;
        user.setCoins(currentCoins + toAdd);

        if (req.vipDays() != null && req.vipDays() > 0) {
            user.setIsVip(true);
            OffsetDateTime currentVipUntil = user.getVipUntil();
            OffsetDateTime baseTime = (currentVipUntil != null && currentVipUntil.isAfter(OffsetDateTime.now()))
                    ? currentVipUntil : OffsetDateTime.now();
            user.setVipUntil(baseTime.plusDays(req.vipDays()));
        }

        userRepository.save(user);
        return ResponseEntity.ok(toDto(user));
    }

    private CoreUserDto toDto(User u) {
        return new CoreUserDto(
                u.getId(),
                u.getUsername(),
                u.getEmail(),
                u.getRole(),
                u.getCoins() != null ? u.getCoins() : 0L,
                u.getIsVip() != null ? u.getIsVip() : false
        );
    }
}

