package com.manga.manga_backend_services.service;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
public class RatingService {
    private final NamedParameterJdbcTemplate db;
    public RatingService(NamedParameterJdbcTemplate db) { this.db=db; }
    public record Summary(UUID mangaId,BigDecimal averageRating,long ratingCount,Integer myRating) {}
    private void manga(UUID manga,boolean lock) {
        var rows=db.queryForList("select approval_status from mangas where id=:manga"+(lock?" for update":""),Map.of("manga",manga));
        if(rows.isEmpty() || !"approved".equalsIgnoreCase((String)rows.getFirst().get("approval_status")))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Manga unavailable");
    }
    private Summary snapshot(UUID manga,UUID user) {
        var args=new MapSqlParameterSource().addValue("manga",manga).addValue("user",user);
        var row=db.queryForMap("""
            select coalesce(avg(rating_star),0) as average_rating,count(rating_star) as rating_count,
            max(case when user_id=cast(:user as uuid) then rating_star end) as my_rating
            from manga_ratings where manga_id=:manga
            """,args);
        var average=new BigDecimal(row.get("average_rating").toString()).setScale(2,RoundingMode.HALF_UP);
        return new Summary(manga,average,((Number)row.get("rating_count")).longValue(),row.get("my_rating")==null?null:((Number)row.get("my_rating")).intValue());
    }
    @Transactional(readOnly=true) public Summary get(UUID manga,UUID viewer) {
        manga(manga,false); return snapshot(manga,viewer);
    }
    @Transactional public Summary save(UUID user,UUID manga,BigDecimal score) {
        int stars;
        try { stars=score.intValueExact(); } catch(ArithmeticException | NullPointerException e) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Rating must be an integer from 1 to 5"); }
        if(stars<1 || stars>5) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Rating must be from 1 to 5");
        var users=db.queryForList("select is_banned from users where id=:user for share",Map.of("user",user));
        if(users.isEmpty()) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        if(Boolean.TRUE.equals(users.getFirst().get("is_banned"))) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        // Serialize writes per manga so the denormalized count and average stay consistent.
        manga(manga,true);
        db.update("""
            insert into manga_ratings(user_id,manga_id,rating_star) values (:user,:manga,:stars)
            on conflict(user_id,manga_id) do update set rating_star=excluded.rating_star
            """,Map.of("user",user,"manga",manga,"stars",stars));
        var summary=snapshot(manga,user);
        db.update("update mangas set rating_score=:average,rating_count=:count where id=:manga",
            Map.of("manga",manga,"average",summary.averageRating(),"count",summary.ratingCount()));
        return summary;
    }
}
