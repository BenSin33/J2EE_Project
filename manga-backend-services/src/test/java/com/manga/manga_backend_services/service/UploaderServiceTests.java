package com.manga.manga_backend_services.service;

import com.manga.manga_backend_services.entity.Manga;
import com.manga.manga_backend_services.entity.User;
import com.manga.manga_backend_services.repository.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UploaderServiceTests {
    final MangaRepository mangas = mock(MangaRepository.class);
    final UploaderService service = new UploaderService(
            mangas, mock(ChapterRepository.class), mock(ChapterPageRepository.class),
            mock(AuthorRepository.class), mock(MangaAuthorRepository.class), mock(TagRepository.class),
            mock(MangaTagRepository.class), mock(CloudinaryService.class), mock(ChapterNotificationService.class),
            mock(EntityManager.class), mock(JdbcTemplate.class), mock(PlatformTransactionManager.class));

    static User user(String role) {
        User u = new User();
        u.setId(UUID.randomUUID());
        u.setRole(role);
        return u;
    }

    @Test
    void naturalOrderPutsPage2BeforePage10() {
        List<String> names = new ArrayList<>(List.of("10.jpg", "2.jpg", "1.jpg", "page_011.png", "page_3.png"));
        names.sort(UploaderService::naturalCompare);
        assertEquals(List.of("1.jpg", "2.jpg", "10.jpg", "page_3.png", "page_011.png"), names);
        assertTrue(UploaderService.naturalCompare("5", "5.5") < 0);
        assertTrue(UploaderService.naturalCompare("5.5", "6") < 0);
    }

    @Test
    void zipIsExtractedSortedAndJunkIgnored() throws Exception {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        try (ZipOutputStream zip = new ZipOutputStream(bytes)) {
            for (String name : List.of("ch1/10.jpg", "ch1/2.jpg", "__MACOSX/ch1/._2.jpg", "ch1/readme.txt", "ch1/.DS_Store", "ch1/1.webp")) {
                zip.putNextEntry(new ZipEntry(name));
                zip.write(new byte[]{1, 2, 3});
                zip.closeEntry();
            }
        }
        var images = service.extractImages(List.of(
                new MockMultipartFile("files", "chapter.zip", "application/zip", bytes.toByteArray()),
                new MockMultipartFile("files", "ch1/3.png", "image/png", new byte[]{9})));
        assertEquals(List.of("ch1/1.webp", "ch1/2.jpg", "ch1/3.png", "ch1/10.jpg"),
                images.stream().map(UploaderService.ImageInput::name).toList());
    }

    @Test
    void unsupportedFileIsRejected() {
        var ex = assertThrows(ResponseStatusException.class, () -> service.extractImages(
                List.of(new MockMultipartFile("files", "virus.exe", "application/octet-stream", new byte[]{1}))));
        assertEquals(400, ex.getStatusCode().value());
    }

    @Test
    void bannedOrAnonymousBlockedAndUsersOnlyTheirOwnManga() {
        User banned = user("ROLE_USER");
        banned.setIsBanned(true);
        assertEquals(403, assertThrows(ResponseStatusException.class, () -> service.stats(banned)).getStatusCode().value());
        assertEquals(401, assertThrows(ResponseStatusException.class, () -> service.stats(null)).getStatusCode().value());
        assertTrue(UploaderService.isUploader(user("ROLE_USER")));

        UUID mangaId = UUID.randomUUID();
        when(mangas.findById(mangaId)).thenReturn(Optional.of(Manga.builder().id(mangaId).uploaderId(UUID.randomUUID()).title("x").build()));
        assertEquals(403, assertThrows(ResponseStatusException.class,
                () -> service.getManga(mangaId, user("ROLE_USER"))).getStatusCode().value());
    }

    @Test
    void mangaDexMangaIsReadOnlyEvenForAdmin() {
        UUID mangaId = UUID.randomUUID();
        when(mangas.findById(mangaId)).thenReturn(Optional.of(Manga.builder().id(mangaId).mangadexId(UUID.randomUUID()).title("x").build()));
        var ex = assertThrows(ResponseStatusException.class, () -> service.uploadCover(mangaId, null, user("ROLE_ADMIN")));
        assertEquals(400, ex.getStatusCode().value());
    }
}
