package com.manga.manga_backend_services.config;
import com.manga.manga_backend_services.service.ChapterNotificationService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
@Configuration
@EnableScheduling
@ConditionalOnProperty(name="notifications.worker.enabled",havingValue="true")
public class NotificationWorker {
 private final ChapterNotificationService service;
 public NotificationWorker(ChapterNotificationService service){this.service=service;}
 @Scheduled(fixedDelayString="${notifications.worker.delay-ms:10000}")
 public void deliver(){service.deliverPending();}
}
