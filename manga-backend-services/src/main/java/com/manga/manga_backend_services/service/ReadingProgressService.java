package com.manga.manga_backend_services.service;

import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.time.OffsetDateTime;
import java.util.*;

@Service
public class ReadingProgressService {
    private final NamedParameterJdbcTemplate db;
    public ReadingProgressService(NamedParameterJdbcTemplate db) { this.db = db; }
    public record Progress(UUID mangaId, UUID chapterId, int lastPage, int totalPages,
            double percentage, OffsetDateTime readAt, String title, String chapterTitle,
            String coverImageUrl, boolean available) {}
    public record History(List<Progress> items, int page, int size, long totalElements) {}

    // Integration contract: authenticated principal name is the internal users.id UUID.
    public UUID currentUser(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        UUID id;
        if (auth.getPrincipal() instanceof com.manga.manga_backend_services.entity.User user) {
            id = user.getId();
        } else {
            try {
                id = UUID.fromString(auth.getName());
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Principal must contain internal user UUID");
            }
        }
        var users = db.queryForList("select is_banned from users where id=:id", Map.of("id", id));
        if (users.isEmpty()) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        if (Boolean.TRUE.equals(users.getFirst().get("is_banned"))) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        return id;
    }

    private static final String SELECT = """
        select h.manga_id, h.last_chapter_id, h.last_page, h.read_at,
               m.title, m.cover_image_url, c.title as chapter_title,
               m.approval_status, c.status as chapter_status,
               (select count(*) from chapter_pages p where p.chapter_id=h.last_chapter_id) as total_pages
        from reading_history h
        left join mangas m on m.id=h.manga_id
        left join chapters c on c.id=h.last_chapter_id and c.manga_id=h.manga_id
        """;

    private Progress map(java.sql.ResultSet r, int row) throws java.sql.SQLException {
        int total = r.getInt("total_pages");
        int page = total > 0 ? Math.max(1, Math.min(r.getInt("last_page"), total)) : 1;
        boolean available = "published".equalsIgnoreCase(r.getString("chapter_status"))
            && "approved".equalsIgnoreCase(r.getString("approval_status")) && total > 0;
        return new Progress(r.getObject("manga_id", UUID.class), r.getObject("last_chapter_id", UUID.class),
            page, total, total > 0 ? page * 100.0 / total : 0, r.getObject("read_at", OffsetDateTime.class),
            r.getString("title"), r.getString("chapter_title"), r.getString("cover_image_url"), available);
    }

    @Transactional(readOnly = true)
    public Progress get(UUID userId, UUID mangaId) {
        var rows = db.query(SELECT + " where h.user_id=:user and h.manga_id=:manga",
            Map.of("user", userId, "manga", mangaId), this::map);
        return rows.isEmpty() ? null : rows.getFirst();
    }

    @Transactional
    public Progress save(UUID userId, UUID mangaId, UUID chapterId, int page) {
        var chapter = db.queryForList("""
            select c.manga_id, c.status, m.approval_status from chapters c
            join mangas m on m.id=c.manga_id where c.id=:chapter for share of c,m
            """, Map.of("chapter", chapterId));
        if (chapter.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        var c = chapter.getFirst();
        if (!mangaId.equals(c.get("manga_id"))) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chapter belongs to another manga");
        if (!"published".equalsIgnoreCase((String)c.get("status")) || !"approved".equalsIgnoreCase((String)c.get("approval_status")))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Content unavailable");
        var pages = db.queryForMap("select count(*) as total, min(page_number) as first, max(page_number) as last from chapter_pages where chapter_id=:chapter", Map.of("chapter", chapterId));
        int total = ((Number)pages.get("total")).intValue();
        if (total == 0 || ((Number)pages.get("first")).intValue() != 1 || ((Number)pages.get("last")).intValue() != total)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Chapter pages are incomplete");
        if (page < 1 || page > total) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid page");
        db.update("""
            insert into reading_history(user_id,manga_id,last_chapter_id,last_page,read_at)
            values (:user,:manga,:chapter,:page,current_timestamp)
            on conflict(user_id,manga_id) do update set last_chapter_id=excluded.last_chapter_id,
            last_page=excluded.last_page, read_at=excluded.read_at
            """, Map.of("user", userId, "manga", mangaId, "chapter", chapterId, "page", page));
        return get(userId, mangaId);
    }

    @Transactional(readOnly = true)
    public History history(UUID userId, int page, int size) {
        if (page < 0 || page > 100000 || size < 1 || size > 100) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        var params = Map.of("user", userId, "limit", size, "offset", (long)page * size);
        var rows = db.query(SELECT + " where h.user_id=:user order by h.read_at desc,h.id desc limit :limit offset :offset", params, this::map);
        Long total = db.queryForObject("select count(*) from reading_history where user_id=:user", params, Long.class);
        return new History(rows, page, size, total == null ? 0 : total);
    }
}
