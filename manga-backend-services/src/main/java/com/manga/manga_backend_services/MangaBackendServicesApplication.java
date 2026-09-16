package com.manga.manga_backend_services;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration;

@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})
public class MangaBackendServicesApplication {

	public static void main(String[] args) {
		SpringApplication.run(MangaBackendServicesApplication.class, args);
	}

}
