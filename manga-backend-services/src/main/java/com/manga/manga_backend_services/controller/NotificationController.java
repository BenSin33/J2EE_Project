package com.manga.manga_backend_services.controller;
import com.manga.manga_backend_services.service.NotificationService;
import com.manga.manga_backend_services.service.ReadingProgressService;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import java.util.UUID;
@RestController
@RequestMapping("/api/v1/me/notifications")
@CrossOrigin(origins="http://localhost:3000",allowCredentials="true")
public class NotificationController {
 private final NotificationService service;private final ReadingProgressService identity;
 public NotificationController(NotificationService service,ReadingProgressService identity){this.service=service;this.identity=identity;}
 @GetMapping public NotificationService.Page list(Authentication auth,@RequestParam(defaultValue="0")int page,@RequestParam(defaultValue="20")int size,@RequestParam(defaultValue="false")boolean unreadOnly){return service.list(identity.currentUser(auth),page,size,unreadOnly);}
 public record Count(long count){}
 @GetMapping("/unread-count") public Count count(Authentication auth){return new Count(service.unreadCount(identity.currentUser(auth)));}
 @PatchMapping("/{id}/read") @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT) public void read(@PathVariable UUID id,Authentication auth){service.read(identity.currentUser(auth),id);}
 @PatchMapping("/read-all") @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT) public void all(Authentication auth){service.readAll(identity.currentUser(auth));}
}
