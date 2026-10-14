package com.manga.manga_backend_services.service;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.*;

@Service
public class ChapterNotificationService {
 private final NamedParameterJdbcTemplate db;
 public ChapterNotificationService(NamedParameterJdbcTemplate db){this.db=db;}
 // Call inside the same @Transactional service that first publishes the chapter.
 @Transactional public boolean enqueueFirstPublication(UUID chapter){
  var rows=db.queryForList("""
   select c.*,m.approval_status,m.mangadex_id as manga_external_id
   from chapters c join mangas m on m.id=c.manga_id where c.id=:chapter for update of c
   """,Map.of("chapter",chapter));
  if(rows.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND);
  var c=rows.getFirst();
  if(!"published".equalsIgnoreCase((String)c.get("status"))||!"approved".equalsIgnoreCase((String)c.get("approval_status")))throw new ResponseStatusException(HttpStatus.CONFLICT,"Chapter must be public");
  if(c.get("mangadex_id")!=null||c.get("manga_external_id")!=null||"mangadex_at_home".equalsIgnoreCase((String)c.get("storage_type")))return false;
  if(c.get("first_published_at")!=null)return false;
  Long pages=db.queryForObject("select count(*) from chapter_pages where chapter_id=:chapter",Map.of("chapter",chapter),Long.class);
  if(pages==null||pages==0)throw new ResponseStatusException(HttpStatus.CONFLICT,"Chapter has no pages");
  db.update("update chapters set first_published_at=current_timestamp where id=:chapter",Map.of("chapter",chapter));
  db.update("insert into chapter_notification_events(chapter_id) values (:chapter) on conflict do nothing",Map.of("chapter",chapter));
  db.update("""
   insert into chapter_notification_recipients(chapter_id,user_id)
   select :chapter,b.user_id from bookmarks b where b.manga_id=:manga and b.notifications_enabled=true
   on conflict do nothing
   """,Map.of("chapter",chapter,"manga",c.get("manga_id")));
  return true;
 }
 @Transactional public int deliverPending(){
  var events=db.queryForList("select chapter_id from chapter_notification_events where processed_at is null order by created_at limit 20 for update skip locked",Map.of());
  for(var event:events){UUID chapter=(UUID)event.get("chapter_id");
   db.update("""
    insert into notifications(user_id,manga_id,chapter_id,manga_title,chapter_title,chapter_number)
    select r.user_id,c.manga_id,c.id,m.title,c.title,c.chapter_number
    from chapter_notification_recipients r
    join chapter_notification_events e on e.chapter_id=r.chapter_id
    join chapters c on c.id=r.chapter_id join mangas m on m.id=c.manga_id
    join bookmarks b on b.user_id=r.user_id and b.manga_id=c.manga_id
    where r.chapter_id=:chapter and lower(c.status)='published' and lower(m.approval_status)='approved' and b.notifications_enabled=true and b.created_at<=e.created_at
    on conflict(user_id,chapter_id) do nothing
    """,Map.of("chapter",chapter));
   db.update("update chapter_notification_events set processed_at=current_timestamp where chapter_id=:chapter",Map.of("chapter",chapter));
  }
  return events.size();
 }
}
