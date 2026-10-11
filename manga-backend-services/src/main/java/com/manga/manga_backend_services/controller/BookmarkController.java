package com.manga.manga_backend_services.controller;
import com.manga.manga_backend_services.service.BookmarkService;
import com.manga.manga_backend_services.service.ReadingProgressService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/me/bookmarks")
@CrossOrigin(origins="http://localhost:3000",allowCredentials="true")
public class BookmarkController {
    private final BookmarkService bookmarks;
    private final ReadingProgressService identity;
    public BookmarkController(BookmarkService bookmarks, ReadingProgressService identity) { this.bookmarks=bookmarks; this.identity=identity; }
    public record Preferences(String folderType, Boolean notificationsEnabled) {}
    @GetMapping public BookmarkService.Library list(Authentication auth,@RequestParam(defaultValue="0") int page,
            @RequestParam(defaultValue="20") int size,@RequestParam(required=false) String folderType) {
        return bookmarks.list(identity.currentUser(auth),page,size,folderType);
    }
    @GetMapping("/{mangaId}") public BookmarkService.Bookmark get(@PathVariable UUID mangaId,Authentication auth) {
        return bookmarks.get(identity.currentUser(auth),mangaId);
    }
    @PutMapping("/{mangaId}") public BookmarkService.Bookmark follow(@PathVariable UUID mangaId,Authentication auth) {
        return bookmarks.follow(identity.currentUser(auth),mangaId);
    }
    @PatchMapping("/{mangaId}") public BookmarkService.Bookmark update(@PathVariable UUID mangaId,@RequestBody Preferences body,Authentication auth) {
        return bookmarks.update(identity.currentUser(auth),mangaId,body.folderType(),body.notificationsEnabled());
    }
    @DeleteMapping("/{mangaId}") @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void unfollow(@PathVariable UUID mangaId,Authentication auth) { bookmarks.unfollow(identity.currentUser(auth),mangaId); }
}
