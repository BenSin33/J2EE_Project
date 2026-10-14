package com.manga.manga_backend_services.service;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.*;
import java.time.OffsetDateTime;

@Service
public class CommentService {
    private final NamedParameterJdbcTemplate db;
    private final int maxLength;
    public CommentService(NamedParameterJdbcTemplate db,@Value("${comments.max-length:2000}") int maxLength) { this.db=db; this.maxLength=maxLength; }
    public record Comment(UUID id, UUID mangaId, UUID chapterId, UUID parentId, String username,
        String content, boolean spoiler, boolean hidden, boolean deleted, OffsetDateTime createdAt,
        OffsetDateTime updatedAt, long replyCount, boolean canEdit, boolean canDelete) {}
    public record Page(List<Comment> items,int page,int size,long totalElements) {}
    private static final String SELECT="""
        select c.*,u.username,
        (select count(*) from comments r where r.parent_id=c.id) as reply_count
        from comments c join users u on u.id=c.user_id
        """;
    private Comment map(java.sql.ResultSet r,UUID viewer) throws java.sql.SQLException {
        boolean hidden=r.getBoolean("is_hidden"), deleted=r.getBoolean("is_deleted");
        boolean owner=viewer!=null && viewer.equals(r.getObject("user_id",UUID.class));
        return new Comment(r.getObject("id",UUID.class),r.getObject("manga_id",UUID.class),r.getObject("chapter_id",UUID.class),r.getObject("parent_id",UUID.class),r.getString("username"),
            hidden || deleted ? "" : r.getString("content"),!hidden && !deleted && r.getBoolean("is_spoiler"),hidden,deleted,
            r.getObject("created_at",OffsetDateTime.class),r.getObject("updated_at",OffsetDateTime.class),r.getLong("reply_count"),owner&&!hidden&&!deleted,owner&&!deleted);
    }
    private void scope(UUID manga,UUID chapter) {
        var m=db.queryForList("select approval_status from mangas where id=:id",Map.of("id",manga));
        if(m.isEmpty() || !"approved".equalsIgnoreCase((String)m.getFirst().get("approval_status"))) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        if(chapter!=null) {
            var c=db.queryForList("select manga_id,status from chapters where id=:id",Map.of("id",chapter));
            if(c.isEmpty() || !manga.equals(c.getFirst().get("manga_id")) || !"published".equalsIgnoreCase((String)c.getFirst().get("status"))) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
    }
    private void actor(UUID user,boolean writing) {
        var rows=db.queryForList("select is_banned,is_muted,muted_until from users where id=:id for share",Map.of("id",user));
        if(rows.isEmpty()) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        var u=rows.getFirst();
        if(Boolean.TRUE.equals(u.get("is_banned"))) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        Object time=u.get("muted_until");
        OffsetDateTime until=time instanceof OffsetDateTime t ? t : time instanceof java.sql.Timestamp t ? t.toInstant().atOffset(java.time.ZoneOffset.UTC) : null;
        if(writing && (until!=null ? until.isAfter(OffsetDateTime.now()) : Boolean.TRUE.equals(u.get("is_muted"))))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Commenting is muted");
    }
    private String content(String text) {
        if(text==null || text.isBlank() || text.strip().length()>maxLength) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid comment length");
        return text.strip();
    }
    private Map<String,Object> row(UUID id) {
        var rows=db.queryForList("select * from comments where id=:id for update",Map.of("id",id));
        if(rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return rows.getFirst();
    }
    private Comment get(UUID id,UUID viewer) {
        return db.query(SELECT+" where c.id=:id",Map.of("id",id),(r,n)->map(r,viewer)).getFirst();
    }
    @Transactional public Comment create(UUID user,UUID manga,UUID chapter,UUID parent,String text,boolean spoiler) {
        String cleaned=content(text); actor(user,true); scope(manga,chapter);
        if(parent!=null) {
            var p=row(parent);
            if(!manga.equals(p.get("manga_id")) || !Objects.equals(chapter,p.get("chapter_id"))) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Reply target belongs to a different scope");
            if(p.get("parent_id")!=null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Reply to the root comment");
            if(Boolean.TRUE.equals(p.get("is_hidden")) || Boolean.TRUE.equals(p.get("is_deleted"))) throw new ResponseStatusException(HttpStatus.CONFLICT,"Reply target unavailable");
        }
        UUID id=UUID.randomUUID();
        var args=new MapSqlParameterSource().addValue("id",id).addValue("user",user).addValue("manga",manga).addValue("chapter",chapter).addValue("parent",parent).addValue("content",cleaned).addValue("spoiler",spoiler);
        db.update("insert into comments(id,user_id,manga_id,chapter_id,parent_id,content,is_spoiler) values (:id,:user,:manga,:chapter,:parent,:content,:spoiler)",args);
        return get(id,user);
    }
    @Transactional public Comment edit(UUID user,UUID id,String text,boolean spoiler) {
        String cleaned=content(text); actor(user,true); var c=row(id);
        if(!user.equals(c.get("user_id"))) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        if(Boolean.TRUE.equals(c.get("is_hidden")) || Boolean.TRUE.equals(c.get("is_deleted"))) throw new ResponseStatusException(HttpStatus.CONFLICT,"Comment cannot be edited");
        scope((UUID)c.get("manga_id"),(UUID)c.get("chapter_id"));
        db.update("update comments set content=:content,is_spoiler=:spoiler,updated_at=current_timestamp where id=:id and user_id=:user",Map.of("id",id,"user",user,"content",cleaned,"spoiler",spoiler));
        return get(id,user);
    }
    @Transactional public void delete(UUID user,UUID id) {
        actor(user,false); var c=row(id);
        if(!user.equals(c.get("user_id"))) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        db.update("update comments set is_deleted=true,updated_at=current_timestamp where id=:id and user_id=:user",Map.of("id",id,"user",user));
    }
    @Transactional public Page list(UUID manga,UUID chapter,UUID parent,UUID viewer,int page,int size) {
        if(page<0 || page>100000 || size<1 || size>50) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        scope(manga,chapter);
        var args=new MapSqlParameterSource().addValue("manga",manga).addValue("chapter",chapter).addValue("parent",parent).addValue("limit",size).addValue("offset",(long)page*size);
        if(parent!=null) { var p=row(parent); if(!manga.equals(p.get("manga_id")) || !Objects.equals(chapter,p.get("chapter_id"))) throw new ResponseStatusException(HttpStatus.BAD_REQUEST); }
        String filter=" where c.manga_id=:manga and c.chapter_id is not distinct from cast(:chapter as uuid) and c.parent_id is not distinct from cast(:parent as uuid)";
        var items=db.query(SELECT+filter+" order by c.created_at desc,c.id desc limit :limit offset :offset",args,(r,n)->map(r,viewer));
        Long total=db.queryForObject("select count(*) from comments c"+filter,args,Long.class);
        return new Page(items,page,size,total==null?0:total);
    }
}
