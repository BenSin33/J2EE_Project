package com.manga.manga_backend_services;
import com.manga.manga_backend_services.service.RatingService;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class RatingServiceTests {
    final NamedParameterJdbcTemplate db=mock(NamedParameterJdbcTemplate.class);
    final RatingService service=new RatingService(db);
    final UUID user=UUID.randomUUID(),manga=UUID.randomUUID();
    void active() {
        when(db.queryForList(anyString(),anyMap())).thenAnswer(inv->((String)inv.getArgument(0)).contains("from users") ? List.of(Map.of("is_banned",false)) : List.of(Map.of("approval_status","approved")));
    }
    Map<String,Object> summary(String average,long count,Integer mine) {
        var result=new HashMap<String,Object>();result.put("average_rating",new BigDecimal(average));result.put("rating_count",count);result.put("my_rating",mine);return result;
    }
    @Test void invalidAndFractionalRatingsNeverQueryOrWrite() {
        for(String score:List.of("0","6","-1","2.5")) assertEquals(400,assertThrows(ResponseStatusException.class,()->service.save(user,manga,new BigDecimal(score))).getStatusCode().value());
        assertThrows(ResponseStatusException.class,()->service.save(user,manga,null));verifyNoInteractions(db);
    }
    @Test void emptyRatingSetHasZeroAverageAndNoPersonalRating() {
        active();when(db.queryForMap(anyString(),any(SqlParameterSource.class))).thenReturn(summary("0",0,null));
        var result=service.get(manga,null);assertEquals(new BigDecimal("0.00"),result.averageRating());assertEquals(0,result.ratingCount());assertNull(result.myRating());
    }
    @Test void guestSummaryDoesNotLeakPersonalRatingAndRoundsAggregate() {
        active();when(db.queryForMap(anyString(),any(SqlParameterSource.class))).thenReturn(summary("3.666666666",3,null));
        var result=service.get(manga,null);assertEquals(new BigDecimal("3.67"),result.averageRating());assertNull(result.myRating());
        verify(db).queryForMap(anyString(),argThat((SqlParameterSource p)->p.getValue("user")==null));
    }
    @Test void hiddenMangaCannotBeRatedOrViewed() {
        when(db.queryForList(anyString(),anyMap())).thenAnswer(inv->((String)inv.getArgument(0)).contains("from users") ? List.of(Map.of("is_banned",false)) : List.of(Map.of("approval_status","hidden")));
        assertEquals(404,assertThrows(ResponseStatusException.class,()->service.save(user,manga,BigDecimal.ONE)).getStatusCode().value());
        assertThrows(ResponseStatusException.class,()->service.get(manga,null));verify(db,never()).update(anyString(),anyMap());
    }
    @Test void bannedUserCannotRate() {
        when(db.queryForList(anyString(),anyMap())).thenReturn(List.of(Map.of("is_banned",true)));
        assertEquals(403,assertThrows(ResponseStatusException.class,()->service.save(user,manga,BigDecimal.ONE)).getStatusCode().value());verify(db,never()).update(anyString(),anyMap());
    }
    @Test void updatingRatingReturnsCurrentAggregateAndSynchronizesCachedFields() {
        active();when(db.queryForMap(anyString(),any(SqlParameterSource.class))).thenReturn(summary("3",1,3),summary("5",1,5));
        var first=service.save(user,manga,new BigDecimal("3"));var second=service.save(user,manga,new BigDecimal("5"));
        assertEquals(1,first.ratingCount());assertEquals(1,second.ratingCount());assertEquals(5,second.myRating());
        verify(db).update(startsWith("update mangas set rating_score"),eq(Map.of("manga",manga,"average",new BigDecimal("5.00"),"count",1L)));
    }
}
