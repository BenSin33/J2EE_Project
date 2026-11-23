package com.manga.notification;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class NotificationMailServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(NotificationMailServiceApplication.class, args);
    }
}

