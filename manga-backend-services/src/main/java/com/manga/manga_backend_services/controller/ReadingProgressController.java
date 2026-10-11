package com.manga.manga_backend_services.controller;
import com.manga.manga_backend_services.service.ReadingProgressService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/me")
@CrossOrigin(origins="http://localhost:3000", allowCredentials="true")
public class ReadingProgressController {
    private final ReadingProgressService service;
    public ReadingProgressController(ReadingProgressService service) { this.service = service; }
    public record SaveRequest(@NotNull UUID chapterId, @Min(1) int lastPage) {}
    @GetMapping("/reading-progress/{mangaId}")
    public ReadingProgressService.Progress get(@PathVariable UUID mangaId, Authentication auth) {
        return service.get(service.currentUser(auth), mangaId);
    }
    @PutMapping("/reading-progress/{mangaId}")
    public ReadingProgressService.Progress save(@PathVariable UUID mangaId, @Valid @RequestBody SaveRequest body, Authentication auth) {
        return service.save(service.currentUser(auth), mangaId, body.chapterId(), body.lastPage());
    }
    @GetMapping("/reading-history")
    public ReadingProgressService.History history(@RequestParam(defaultValue="0") int page,
            @RequestParam(defaultValue="20") int size, Authentication auth) {
        return service.history(service.currentUser(auth), page, size);
    }
}
