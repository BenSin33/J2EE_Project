package com.manga.manga_backend_services;
import com.manga.manga_backend_services.service.NotificationService;
import com.manga.manga_backend_services.service.ChapterNotificationService;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.junit.jupiter.api.Test;
import java.util.*;
import java.time.OffsetDateTime;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
class NotificationServiceTests {
 final NamedParameterJdbcTemplate db=mock(NamedParameterJdbcTemplate.class);
 final NotificationService inbox=new NotificationService(db);
 final ChapterNotificationService delivery=new ChapterNotificationService(db);
 final UUID user=UUID.randomUUID(),chapter=UUID.randomUUID(),manga=UUID.randomUUID(),id=UUID.randomUUID();
 Map<String,Object> chapter(){return new HashMap<>(Map.of("status","published","approval_status","approved","storage_type","s3","manga_id",manga));}
 @Test void anotherUsersNotificationCannotBeMarkedRead(){
  assertEquals(404,assertThrows(ResponseStatusException.class,()->inbox.read(user,id)).getStatusCode().value());
  verify(db).update(anyString(),eq(Map.of("id",id,"user",user)));
 }
 @Test void markAllOnlyChangesCurrentUserUnreadRows(){inbox.readAll(user);verify(db).update(contains("where user_id=:user and read_at is null"),eq(Map.of("user",user)));}
 @Test void editedOrRepublishedChapterDoesNotEnqueueAgain(){var c=chapter();c.put("first_published_at",OffsetDateTime.now());when(db.queryForList(anyString(),anyMap())).thenReturn(List.of(c));assertFalse(delivery.enqueueFirstPublication(chapter));verify(db,never()).update(anyString(),anyMap());}
 @Test void externalChapterNeverEnqueues(){var c=chapter();c.put("mangadex_id",UUID.randomUUID());when(db.queryForList(anyString(),anyMap())).thenReturn(List.of(c));assertFalse(delivery.enqueueFirstPublication(chapter));verify(db,never()).update(anyString(),anyMap());}
 @Test void draftAndEmptyChaptersDoNotEnqueue(){var c=chapter();c.put("status","draft");when(db.queryForList(anyString(),anyMap())).thenReturn(List.of(c));assertThrows(ResponseStatusException.class,()->delivery.enqueueFirstPublication(chapter));c.put("status","published");when(db.queryForObject(anyString(),anyMap(),eq(Long.class))).thenReturn(0L);assertThrows(ResponseStatusException.class,()->delivery.enqueueFirstPublication(chapter));verify(db,never()).update(anyString(),anyMap());}
 @Test void firstPublicationSnapshotsEligibleFollowers(){when(db.queryForList(anyString(),anyMap())).thenReturn(List.of(chapter()));when(db.queryForObject(anyString(),anyMap(),eq(Long.class))).thenReturn(3L);assertTrue(delivery.enqueueFirstPublication(chapter));verify(db).update(contains("insert into chapter_notification_recipients"),eq(Map.of("chapter",chapter,"manga",manga)));}
 @Test void deliveryFailureDoesNotMarkEventCompleted(){when(db.queryForList(anyString(),anyMap())).thenReturn(List.of(Map.of("chapter_id",chapter)));when(db.update(contains("insert into notifications"),anyMap())).thenThrow(new IllegalStateException("temporary failure"));assertThrows(IllegalStateException.class,()->delivery.deliverPending());verify(db,never()).update(startsWith("update chapter_notification_events set processed_at"),anyMap());}
 @Test void invalidPaginationDoesNotReadInbox(){assertThrows(ResponseStatusException.class,()->inbox.list(user,-1,20,false));assertThrows(ResponseStatusException.class,()->inbox.list(user,0,101,false));verifyNoInteractions(db);}
}
