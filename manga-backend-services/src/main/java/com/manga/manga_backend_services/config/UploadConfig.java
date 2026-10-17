package com.manga.manga_backend_services.config;

import jakarta.servlet.MultipartConfigElement;
import org.springframework.boot.servlet.MultipartConfigFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.unit.DataSize;

/**
 * Thành viên 2 - Giới hạn upload cho Uploader Dashboard (mặc định Spring chỉ cho 1MB/file, 10MB/request).
 * Đặt ở đây để không phải sửa application.properties chung.
 */
@Configuration
public class UploadConfig {

    @Bean
    public MultipartConfigElement multipartConfigElement() {
        MultipartConfigFactory factory = new MultipartConfigFactory();
        factory.setMaxFileSize(DataSize.ofMegabytes(100));
        factory.setMaxRequestSize(DataSize.ofMegabytes(300));
        return factory.createMultipartConfig();
    }
}
