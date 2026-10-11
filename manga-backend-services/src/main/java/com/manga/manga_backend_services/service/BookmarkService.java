package com.manga.manga_backend_services.service;

import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.time.OffsetDateTime;
import java.util.*;

@Service
public class BookmarkService {
    private final NamedParameterJdbcTemplate db;
    public BookmarkService(NamedParameterJdbcTemplate db) { this.db = db; }
    public static final Set<String> FOLDERS = Set.of("reading", "plan_to_read", "completed", "re_reading", "dropped");
    public record Bookmark(UUID mangaId, String title, String coverImageUrl, String folderType,
            boolean notificationsEnabled, OffsetDateTime createdAt, boolean available) {}
    public record Library(List<Bookmark> items, int page, int size, long totalElements) {}
    private static final String SELECT = """
        select b.manga_id,b.folder_type,b.notifications_enabled,b.created_at,
               m.title,m.cover_image_url,m.approval_status
        from bookmarks b left join mangas m on m.id=b.manga_id
        """;
    private Bookmark map(java.sql.ResultSet r, int row) throws java.sql.SQLException {
        return new Bookmark(r.getObject("manga_id", UUID.class), r.getString("title"), r.getString("cover_image_url"),
            r.getString("folder_type"),r.getBoolean("notifications_enabled"),r.getObject("created_at",OffsetDateTime.class),
            "approved".equalsIgnoreCase(r.getString("approval_status")));
    }
    @Transactional(readOnly=true)
    public Bookmark get(UUID user, UUID manga) {
        var result = db.query(SELECT + " where b.user_id=:user and b.manga_id=:manga", Map.of("user",user,"manga",manga), this::map);
        return result.isEmpty() ? null : result.getFirst();
    }
    @Transactional
    public Bookmark follow(UUID user, UUID manga) {
        // Repeating Follow keeps the existing folder and notification preference.
        var existing = get(user,manga);
        if (existing != null) return existing;
        var rows = db.queryForList("select approval_status from mangas where id=:manga for share",Map.of("manga",manga));
        if (rows.isEmpty() || !"approved".equalsIgnoreCase((String)rows.getFirst().get("approval_status")))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Manga unavailable");
        db.update("""
            insert into bookmarks(user_id,manga_id,folder_type,notifications_enabled)
            values (:user,:manga,'reading',false)
            on conflict(user_id,manga_id) do nothing
            """,Map.of("user",user,"manga",manga));
        return get(user,manga);
    }
    @Transactional
    public Bookmark update(UUID user, UUID manga, String folder, Boolean notifications) {
        if ((folder == null && notifications == null) || (folder != null && !FOLDERS.contains(folder)))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid bookmark preferences");
        var params = new MapSqlParameterSource().addValue("user",user).addValue("manga",manga);
        String changes = "";
        if (folder != null) { changes = "folder_type=:folder"; params.addValue("folder",folder); }
        if (notifications != null) { changes += (changes.isEmpty() ? "" : ",") + "notifications_enabled=:notifications"; params.addValue("notifications",notifications); }
        if (db.update("update bookmarks set " + changes + " where user_id=:user and manga_id=:manga",params) == 0)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Bookmark not found");
        return get(user,manga);
    }
    @Transactional
    public void unfollow(UUID user, UUID manga) {
        db.update("delete from bookmarks where user_id=:user and manga_id=:manga",Map.of("user",user,"manga",manga));
    }
    @Transactional(readOnly=true)
    public Library list(UUID user, int page, int size, String folder) {
        if (page < 0 || page > 100000 || size < 1 || size > 100 || (folder != null && !FOLDERS.contains(folder)))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid pagination or folder");
        var params = new MapSqlParameterSource().addValue("user",user).addValue("limit",size).addValue("offset",(long)page*size);
        String filter = " where b.user_id=:user";
        if (folder != null) { filter += " and b.folder_type=:folder"; params.addValue("folder",folder); }
        var items = db.query(SELECT + filter + " order by b.created_at desc,b.id desc limit :limit offset :offset",params,this::map);
        Long total = db.queryForObject("select count(*) from bookmarks b" + filter,params,Long.class);
        return new Library(items,page,size,total == null ? 0 : total);
    }
}
