package com.manga.manga_backend_services.controller;
import com.manga.manga_backend_services.service.CommentService;
import com.manga.manga_backend_services.service.ReadingProgressService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins="http://localhost:3000",allowCredentials="true")
public class CommentController {
    private final CommentService comments;
    private final ReadingProgressService identity;
    public CommentController(CommentService comments,ReadingProgressService identity) { this.comments=comments; this.identity=identity; }
    public record Create(@NotNull UUID mangaId,UUID chapterId,UUID parentId,@NotNull String content,boolean spoiler) {}
    public record Edit(@NotNull String content,boolean spoiler) {}
    private UUID viewer(Authentication auth) {
        if(auth==null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) return null;
        try { return identity.currentUser(auth); } catch(ResponseStatusException e) { return null; }
    }
    @GetMapping("/mangas/{mangaId}/comments") public CommentService.Page list(@PathVariable UUID mangaId,
        @RequestParam(required=false) UUID chapterId,@RequestParam(required=false) UUID parentId,
        @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size,Authentication auth) {
        return comments.list(mangaId,chapterId,parentId,viewer(auth),page,size);
    }
    @PostMapping("/me/comments") public CommentService.Comment create(@Valid @RequestBody Create body,Authentication auth) {
        return comments.create(identity.currentUser(auth),body.mangaId(),body.chapterId(),body.parentId(),body.content(),body.spoiler());
    }
    @PatchMapping("/me/comments/{id}") public CommentService.Comment edit(@PathVariable UUID id,@Valid @RequestBody Edit body,Authentication auth) {
        return comments.edit(identity.currentUser(auth),id,body.content(),body.spoiler());
    }
    @DeleteMapping("/me/comments/{id}") @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id,Authentication auth) { comments.delete(identity.currentUser(auth),id); }
}
