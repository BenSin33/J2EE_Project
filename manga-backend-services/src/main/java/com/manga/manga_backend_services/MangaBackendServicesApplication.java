package com.manga.manga_backend_services;

import org.aspectj.weaver.BoundedReferenceType;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration;
import org.springframework.context.annotation.Bean;

import javax.sql.DataSource;
import java.sql.Connection;

@SpringBootApplication
public class MangaBackendServicesApplication {

	public static void main(String[] args) {
		SpringApplication.run(MangaBackendServicesApplication.class, args);
	}

    @Bean
    public CommandLineRunner testDatabaseConnection(DataSource dataSource) {
        return args -> {
            System.out.println("--------------------------------------------------");
            try (Connection connection = dataSource.getConnection()) {
                System.out.println(">>> TRẠNG THÁI: KẾT NỐI SUPABASE THÀNH CÔNG! <<<");
                System.out.println(">>> Database hiện tại: " + connection.getCatalog());
                System.out.println(">>> Driver: " + connection.getMetaData().getDriverName());
            } catch (Exception e) {
                System.err.println(">>> KẾT NỐI THẤT BẠI: " + e.getMessage());
            }
            System.out.println("--------------------------------------------------");
        };
    }
}
