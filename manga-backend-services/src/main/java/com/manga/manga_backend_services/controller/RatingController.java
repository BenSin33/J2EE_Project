package com.manga.manga_backend_services.controller;
import com.manga.manga_backend_services.service.RatingService;
import com.manga.manga_backend_services.service.ReadingProgressService;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins="http://localhost:3000",allowCredentials="true")
public class RatingController {
    private final RatingService ratings;
    private final ReadingProgressService identity;
    public RatingController(RatingService ratings,ReadingProgressService identity) { this.ratings=ratings;this.identity=identity; }
    public record Score(@NotNull BigDecimal rating) {}
    @GetMapping("/mangas/{mangaId}/rating") public RatingService.Summary get(@PathVariable UUID mangaId,Authentication auth) {
        UUID viewer=null;
        if(auth!=null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken)) {
            try { viewer=identity.currentUser(auth); } catch(ResponseStatusException ignored) {}
        }
        return ratings.get(mangaId,viewer);
    }
    @PutMapping("/me/mangas/{mangaId}/rating") public RatingService.Summary save(@PathVariable UUID mangaId,@Valid @RequestBody Score body,Authentication auth) {
        return ratings.save(identity.currentUser(auth),mangaId,body.rating());
    }
}
