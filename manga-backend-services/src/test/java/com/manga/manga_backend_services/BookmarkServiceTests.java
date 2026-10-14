package com.manga.manga_backend_services;
import com.manga.manga_backend_services.service.BookmarkService;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.web.server.ResponseStatusException;
import java.time.OffsetDateTime;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class BookmarkServiceTests {
    final NamedParameterJdbcTemplate db=mock(NamedParameterJdbcTemplate.class);
    final BookmarkService service=new BookmarkService(db);
    final UUID user=UUID.randomUUID(), manga=UUID.randomUUID();
    final BookmarkService.Bookmark bookmark=new BookmarkService.Bookmark(manga,"Title",null,"completed",true,OffsetDateTime.now(),true);
    void existing(BookmarkService.Bookmark value) {
        when(db.query(anyString(), anyMap(), org.mockito.ArgumentMatchers.<RowMapper<BookmarkService.Bookmark>>any()))
            .thenReturn(value==null ? List.of() : List.of(value));
    }
    @Test void followingAgainKeepsPreferencesAndDoesNotInsert() {
        existing(bookmark);
        assertEquals(bookmark,service.follow(user,manga));
        verify(db,never()).update(anyString(),anyMap());
    }
    @Test void hiddenOrMissingMangaCannotBeFollowed() {
        existing(null);
        when(db.queryForList(anyString(),anyMap())).thenReturn(List.of());
        assertEquals(404,assertThrows(ResponseStatusException.class,()->service.follow(user,manga)).getStatusCode().value());
        when(db.queryForList(anyString(),anyMap())).thenReturn(List.of(Map.of("approval_status","hidden")));
        assertEquals(404,assertThrows(ResponseStatusException.class,()->service.follow(user,manga)).getStatusCode().value());
        verify(db,never()).update(anyString(),anyMap());
    }
    @Test void invalidPreferencesNeverWrite() {
        assertThrows(ResponseStatusException.class,()->service.update(user,manga,null,null));
        assertThrows(ResponseStatusException.class,()->service.update(user,manga,"arbitrary",true));
        verifyNoInteractions(db);
    }
    @Test void changingFolderLeavesNotificationPreferenceUntouched() {
        existing(bookmark);
        when(db.update(anyString(),any(MapSqlParameterSource.class))).thenReturn(1);
        service.update(user,manga,"reading",null);
        verify(db).update(argThat(sql->!sql.contains("notifications_enabled")),argThat((MapSqlParameterSource params)->
            user.equals(params.getValue("user")) && "reading".equals(params.getValue("folder")) && !params.hasValue("notifications")));
    }
    @Test void turningNotificationsOffLeavesFolderUntouched() {
        existing(bookmark);
        when(db.update(anyString(),any(MapSqlParameterSource.class))).thenReturn(1);
        service.update(user,manga,null,false);
        verify(db).update(argThat(sql->!sql.contains("folder_type")),argThat((MapSqlParameterSource params)->
            Boolean.FALSE.equals(params.getValue("notifications")) && !params.hasValue("folder")));
    }
    @Test void updatingMissingBookmarkDoesNotCreateFollowRelationship() {
        assertEquals(404,assertThrows(ResponseStatusException.class,()->service.update(user,manga,"reading",null)).getStatusCode().value());
        verify(db).update(startsWith("update bookmarks"),any(MapSqlParameterSource.class));
    }
    @Test void unfollowOnlyRemovesOwnBookmarkNeverHistory() {
        service.unfollow(user,manga);
        verify(db).update(eq("delete from bookmarks where user_id=:user and manga_id=:manga"),eq(Map.of("user",user,"manga",manga)));
        verifyNoMoreInteractions(db);
    }
    @Test void invalidPaginationAndFiltersDoNotQueryDatabase() {
        assertThrows(ResponseStatusException.class,()->service.list(user,-1,20,null));
        assertThrows(ResponseStatusException.class,()->service.list(user,0,101,null));
        assertThrows(ResponseStatusException.class,()->service.list(user,0,20,"invalid"));
        verifyNoInteractions(db);
    }
}
