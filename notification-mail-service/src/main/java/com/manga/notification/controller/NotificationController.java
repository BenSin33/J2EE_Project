package com.manga.notification.controller;

import com.manga.notification.security.JwtIdentityResolver;
import com.manga.notification.service.NotificationService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/me/notifications")
public class NotificationController {

    private final NotificationService service;
    private final JwtIdentityResolver identity;

    public NotificationController(NotificationService service, JwtIdentityResolver identity) {
        this.service = service;
        this.identity = identity;
    }

    public record Count(long count) {}

    @GetMapping
    public NotificationService.Page list(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "false") boolean unreadOnly,
            HttpServletResponse response
    ) {
        return service.list(identity.requireUserId(authHeader, response), page, size, unreadOnly);
    }

    @GetMapping("/unread-count")
    public Count count(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            HttpServletResponse response
    ) {
        return new Count(service.unreadCount(identity.requireUserId(authHeader, response)));
    }

    @PatchMapping("/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void read(
            @PathVariable UUID id,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            HttpServletResponse response
    ) {
        service.read(identity.requireUserId(authHeader, response), id);
    }

    @PatchMapping("/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void all(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            HttpServletResponse response
    ) {
        service.readAll(identity.requireUserId(authHeader, response));
    }
}

