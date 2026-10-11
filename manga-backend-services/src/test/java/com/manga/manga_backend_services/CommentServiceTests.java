package com.manga.manga_backend_services;
import com.manga.manga_backend_services.service.CommentService;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.web.server.ResponseStatusException;
import java.time.OffsetDateTime;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class CommentServiceTests {
    final NamedParameterJdbcTemplate db=mock(NamedParameterJdbcTemplate.class);
    final CommentService service=new CommentService(db,2000);
    final UUID user=UUID.randomUUID(),manga=UUID.randomUUID(),id=UUID.randomUUID();
    Map<String,Object> comment=new HashMap<>(Map.of("user_id",user,"manga_id",manga,"is_hidden",false,"is_deleted",false));
    Map<String,Object> actor=new HashMap<>(Map.of("is_banned",false,"is_muted",false));
    CommentServiceTests() {
        when(db.queryForList(anyString(),anyMap())).thenAnswer(inv->{String sql=inv.getArgument(0);
            if(sql.contains("from users")) return List.of(actor);
            if(sql.contains("from mangas")) return List.of(Map.of("approval_status","approved"));
            if(sql.contains("from comments")) return List.of(comment);
            return List.of();
        });
        var response=new CommentService.Comment(id,manga,null,null,"user","text",false,false,false,OffsetDateTime.now(),null,0,true,true);
        when(db.query(anyString(),anyMap(),org.mockito.ArgumentMatchers.<RowMapper<CommentService.Comment>>any())).thenReturn(List.of(response));
    }
    @Test void blankAndOversizeTextNeverWrite() {
        assertThrows(ResponseStatusException.class,()->service.create(user,manga,null,null," ",false));
        assertThrows(ResponseStatusException.class,()->service.create(user,manga,null,null,"a".repeat(2001),false));
        verify(db,never()).update(anyString(),any(SqlParameterSource.class));
    }
    @Test void muteBlocksNewCommentsAndRepliesAndExpiredMuteAllowsWriting() {
        actor.put("is_muted",true);
        actor.put("muted_until",OffsetDateTime.now().plusHours(1));
        assertEquals(403,assertThrows(ResponseStatusException.class,()->service.create(user,manga,null,null,"hello",false)).getStatusCode().value());
        assertThrows(ResponseStatusException.class,()->service.create(user,manga,null,id,"hello",false));
        verify(db,never()).update(anyString(),any(SqlParameterSource.class));
        actor.put("muted_until",OffsetDateTime.now().minusHours(1));
        service.create(user,manga,null,null,"hello",false);
        verify(db).update(startsWith("insert into comments"),any(SqlParameterSource.class));
    }
    @Test void bannedActorCannotWrite() {
        actor.put("is_banned",true);
        assertEquals(403,assertThrows(ResponseStatusException.class,()->service.create(user,manga,null,null,"hello",false)).getStatusCode().value());
        verify(db,never()).update(anyString(),any(SqlParameterSource.class));
    }
    @Test void anotherAuthorCannotEditOrDelete() {
        comment.put("user_id",UUID.randomUUID());
        assertEquals(403,assertThrows(ResponseStatusException.class,()->service.edit(user,id,"hello",false)).getStatusCode().value());
        assertThrows(ResponseStatusException.class,()->service.delete(user,id));
        verify(db,never()).update(anyString(),anyMap());
    }
    @Test void hiddenOrDeletedCommentCannotBeRestoredByAuthor() {
        comment.put("is_hidden",true);
        assertEquals(409,assertThrows(ResponseStatusException.class,()->service.edit(user,id,"hello",false)).getStatusCode().value());
        comment.put("is_hidden",false);comment.put("is_deleted",true);
        assertThrows(ResponseStatusException.class,()->service.edit(user,id,"hello",false));
        verify(db,never()).update(anyString(),anyMap());
    }
    @Test void replyCannotCrossScopeOrTargetDeletedRoot() {
        comment.put("manga_id",UUID.randomUUID());
        assertEquals(400,assertThrows(ResponseStatusException.class,()->service.create(user,manga,null,id,"reply",false)).getStatusCode().value());
        comment.put("manga_id",manga);comment.put("is_deleted",true);
        assertEquals(409,assertThrows(ResponseStatusException.class,()->service.create(user,manga,null,id,"reply",false)).getStatusCode().value());
        verify(db,never()).update(anyString(),any(SqlParameterSource.class));
    }
    @Test void deletionUpdatesOnlySelectedCommentAndKeepsRepliesEvenWhenMuted() {
        actor.put("is_muted",true);
        service.delete(user,id);
        verify(db).update(startsWith("update comments set is_deleted=true"),eq(Map.of("id",id,"user",user)));
        verify(db,never()).update(startsWith("delete"),anyMap());
    }
    @Test void hiddenContentIsNeverSentToGuest() throws Exception {
        var rs=mock(java.sql.ResultSet.class);
        when(rs.getBoolean("is_hidden")).thenReturn(true);
        when(rs.getString("content")).thenReturn("secret text");
        when(db.query(anyString(),any(SqlParameterSource.class),org.mockito.ArgumentMatchers.<RowMapper<CommentService.Comment>>any()))
            .thenAnswer(inv->{RowMapper<CommentService.Comment> mapper=inv.getArgument(2);return List.of(mapper.mapRow(rs,0));});
        when(db.queryForObject(anyString(),any(SqlParameterSource.class),eq(Long.class))).thenReturn(1L);
        var item=service.list(manga,null,null,null,0,20).items().getFirst();
        assertEquals("",item.content());assertFalse(item.canEdit());assertTrue(item.hidden());
    }
}
