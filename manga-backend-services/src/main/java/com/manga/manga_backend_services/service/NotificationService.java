package com.manga.manga_backend_services.service;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.*;
import java.time.OffsetDateTime;

@Service
public class NotificationService {
 private final NamedParameterJdbcTemplate db;
 public NotificationService(NamedParameterJdbcTemplate db){this.db=db;}
 public record Notification(UUID id,UUID mangaId,UUID chapterId,String mangaTitle,String chapterTitle,String chapterNumber,OffsetDateTime createdAt,OffsetDateTime readAt,boolean available){}
 public record Page(List<Notification> items,int page,int size,long totalElements){}
 @Transactional(readOnly=true) public Page list(UUID user,int page,int size,boolean unread){
  if(page<0||page>100000||size<1||size>100)throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
  var args=Map.of("user",user,"limit",size,"offset",(long)page*size);
  String filter=" where n.user_id=:user"+(unread?" and n.read_at is null":"");
  var items=db.query("""
   select n.*, c.status as chapter_status,m.approval_status
   from notifications n left join chapters c on c.id=n.chapter_id
   left join mangas m on m.id=n.manga_id
   """+filter+" order by n.created_at desc,n.id desc limit :limit offset :offset",args,(r,i)->new Notification(
    r.getObject("id",UUID.class),r.getObject("manga_id",UUID.class),r.getObject("chapter_id",UUID.class),r.getString("manga_title"),r.getString("chapter_title"),r.getString("chapter_number"),r.getObject("created_at",OffsetDateTime.class),r.getObject("read_at",OffsetDateTime.class),"published".equalsIgnoreCase(r.getString("chapter_status"))&&"approved".equalsIgnoreCase(r.getString("approval_status"))));
  Long count=db.queryForObject("select count(*) from notifications n"+filter,args,Long.class);
  return new Page(items,page,size,count==null?0:count);
 }
 @Transactional(readOnly=true) public long unreadCount(UUID user){Long n=db.queryForObject("select count(*) from notifications where user_id=:user and read_at is null",Map.of("user",user),Long.class);return n==null?0:n;}
 @Transactional public void read(UUID user,UUID id){
  if(db.update("update notifications set read_at=coalesce(read_at,current_timestamp) where id=:id and user_id=:user",Map.of("id",id,"user",user))==0)throw new ResponseStatusException(HttpStatus.NOT_FOUND);
 }
 @Transactional public void readAll(UUID user){db.update("update notifications set read_at=current_timestamp where user_id=:user and read_at is null",Map.of("user",user));}
}
