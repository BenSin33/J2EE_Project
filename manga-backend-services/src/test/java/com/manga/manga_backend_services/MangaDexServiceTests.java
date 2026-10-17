package com.manga.manga_backend_services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.manga.manga_backend_services.repository.*;
import com.manga.manga_backend_services.service.CloudinaryService;
import com.manga.manga_backend_services.service.MangaDexService;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class MangaDexServiceTests {
    final CloudinaryService cloudinary = mock(CloudinaryService.class);
    final MangaDexService service = new MangaDexService(
            mock(MangaRepository.class), mock(ChapterRepository.class), mock(ChapterPageRepository.class),
            mock(AuthorRepository.class), mock(MangaAuthorRepository.class), mock(TagRepository.class),
            mock(MangaTagRepository.class), cloudinary, new ObjectMapper(),
            mock(PlatformTransactionManager.class), "", 0);

    @Test
    void extractsIdFromMangaDexUrlOrRawUuid() {
        UUID id = UUID.fromString("32d76d19-8a05-4db0-9fc2-e0b0648fe9d0");
        assertEquals(id, service.extractMangadexId("https://mangadex.org/title/32d76d19-8a05-4db0-9fc2-e0b0648fe9d0/solo-leveling"));
        assertEquals(id, service.extractMangadexId("  32D76D19-8A05-4DB0-9FC2-E0B0648FE9D0 "));
    }

    @Test
    void rejectsInputWithoutUuid() {
        for (String bad : new String[]{null, "", "   ", "https://mangadex.org/title/abc"}) {
            var ex = assertThrows(ResponseStatusException.class, () -> service.extractMangadexId(bad));
            assertEquals(400, ex.getStatusCode().value());
        }
    }

    @Test
    void blankSearchIsRejectedWithoutCallingMangaDex() {
        var ex = assertThrows(ResponseStatusException.class, () -> service.search("  ", 10));
        assertEquals(400, ex.getStatusCode().value());
    }

    @Test
    void mirrorRequiresCloudinaryConfig() {
        when(cloudinary.isEnabled()).thenReturn(false);
        var ex = assertThrows(ResponseStatusException.class, () -> service.mirrorChapterToCloudinary(UUID.randomUUID()));
        assertEquals(400, ex.getStatusCode().value());
    }
}
