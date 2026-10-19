package com.manga.manga_backend_services;
import com.manga.manga_backend_services.service.ReadingProgressService;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class ReadingProgressServiceTests {
    final NamedParameterJdbcTemplate db = mock(NamedParameterJdbcTemplate.class);
    final ReadingProgressService service = new ReadingProgressService(db);
    final UUID user = UUID.randomUUID(), manga = UUID.randomUUID(), chapter = UUID.randomUUID();
    @Test void guestAndMalformedPrincipalCannotAccessDatabaseHistory() {
        assertEquals(401, assertThrows(ResponseStatusException.class, () -> service.currentUser(null)).getStatusCode().value());
        var auth = new UsernamePasswordAuthenticationToken("not-a-user-id", "", List.of());
        assertEquals(401, assertThrows(ResponseStatusException.class, () -> service.currentUser(auth)).getStatusCode().value());
        verifyNoInteractions(db);
    }
    @Test void bannedUserIsRejectedAndActiveUserResolvesFromPrincipal() {
        var principal = com.manga.manga_backend_services.entity.User.builder().id(user).username("reader").build();
        var auth = new UsernamePasswordAuthenticationToken(principal, "", List.of());
        when(db.queryForList(anyString(), anyMap())).thenReturn(List.of(Map.of("is_banned", true)));
        assertEquals(403, assertThrows(ResponseStatusException.class, () -> service.currentUser(auth)).getStatusCode().value());
        when(db.queryForList(anyString(), anyMap())).thenReturn(List.of(Map.of("is_banned", false)));
        assertEquals(user, service.currentUser(auth));
    }
    @Test void uuidStringAndUnsavedUserCannotImpersonateAuthenticatedUser() {
        var uuidPrincipal = new UsernamePasswordAuthenticationToken(user.toString(), "", List.of());
        var unsaved = new UsernamePasswordAuthenticationToken(
            com.manga.manga_backend_services.entity.User.builder().username("reader").build(), "", List.of());
        assertEquals(401, assertThrows(ResponseStatusException.class, () -> service.currentUser(uuidPrincipal)).getStatusCode().value());
        assertEquals(401, assertThrows(ResponseStatusException.class, () -> service.currentUser(unsaved)).getStatusCode().value());
        verifyNoInteractions(db);
    }
    @Test void chapterFromAnotherMangaAndHiddenChapterDoNotWrite() {
        when(db.queryForList(anyString(), anyMap())).thenReturn(List.of(Map.of("manga_id", UUID.randomUUID(), "status", "published", "approval_status", "approved")));
        assertEquals(400, assertThrows(ResponseStatusException.class, () -> service.save(user,manga,chapter,1)).getStatusCode().value());
        when(db.queryForList(anyString(), anyMap())).thenReturn(List.of(Map.of("manga_id", manga, "status", "hidden", "approval_status", "approved")));
        assertEquals(404, assertThrows(ResponseStatusException.class, () -> service.save(user,manga,chapter,1)).getStatusCode().value());
        verify(db,never()).update(anyString(),anyMap());
    }
    @Test void invalidPageAndIncompletePagesDoNotOverwriteHistory() {
        when(db.queryForList(anyString(), anyMap())).thenReturn(List.of(Map.of("manga_id", manga, "status", "published", "approval_status", "approved")));
        when(db.queryForMap(anyString(),anyMap())).thenReturn(Map.of("total",3L,"first",1,"last",3));
        assertEquals(400, assertThrows(ResponseStatusException.class, () -> service.save(user,manga,chapter,4)).getStatusCode().value());
        when(db.queryForMap(anyString(),anyMap())).thenReturn(Map.of("total",2L,"first",1,"last",3));
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> service.save(user,manga,chapter,2)).getStatusCode().value());
        verify(db,never()).update(anyString(),anyMap());
    }
}
