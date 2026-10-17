package com.manga.manga_backend_services.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;
import java.util.TreeMap;

/**
 * Upload ảnh lên Cloudinary qua REST API (không cần thêm SDK vào pom.xml).
 * Cấu hình bằng biến môi trường CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
 * hoặc property cloudinary.cloud-name / cloudinary.api-key / cloudinary.api-secret.
 * Nếu chưa cấu hình, isEnabled() trả về false và crawler sẽ giữ link ảnh gốc của MangaDex.
 */
@Service
@Slf4j
public class CloudinaryService {

    private final String cloudName;
    private final String apiKey;
    private final String apiSecret;
    private final String rootFolder;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public CloudinaryService(
            ObjectMapper objectMapper,
            @Value("${cloudinary.cloud-name:${CLOUDINARY_CLOUD_NAME:}}") String cloudName,
            @Value("${cloudinary.api-key:${cloudinary.cloud-api-key:${CLOUDINARY_API_KEY:}}}") String apiKey,
            @Value("${cloudinary.api-secret:${cloudinary.cloud-api-secret:${CLOUDINARY_API_SECRET:}}}") String apiSecret,
            @Value("${cloudinary.folder:mangahub}") String rootFolder
    ) {
        this.objectMapper = objectMapper;
        this.cloudName = cloudName.trim();
        this.apiKey = apiKey.trim();
        this.apiSecret = apiSecret.trim();
        this.rootFolder = rootFolder.trim();

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(15000);
        factory.setReadTimeout(60000);
        this.restTemplate = new RestTemplate(factory);

        if (isEnabled()) {
            log.info("Cloudinary enabled (cloud: {}, folder: {})", this.cloudName, this.rootFolder);
        } else {
            log.warn("Cloudinary chưa được cấu hình - ảnh sẽ dùng link gốc của MangaDex");
        }
    }

    public boolean isEnabled() {
        return !cloudName.isEmpty() && !apiKey.isEmpty() && !apiSecret.isEmpty();
    }

    /**
     * Upload ảnh (dạng byte) lên Cloudinary.
     *
     * @param bytes      nội dung ảnh
     * @param subFolder  thư mục con bên trong thư mục gốc, ví dụ "covers" hoặc "chapters/{chapterId}"
     * @param publicId   tên file trên Cloudinary (không có đuôi), upload lại cùng publicId sẽ ghi đè
     * @param toWebp     true để Cloudinary convert sang WebP khi lưu
     */
    public UploadResult upload(byte[] bytes, String subFolder, String publicId, boolean toWebp) {
        if (!isEnabled()) {
            throw new IllegalStateException("Cloudinary chưa được cấu hình");
        }

        String folder = rootFolder.isEmpty() ? subFolder : rootFolder + "/" + subFolder;
        long timestamp = System.currentTimeMillis() / 1000;

        // Các tham số được ký (theo thứ tự alphabet), không gồm file / api_key / resource_type
        Map<String, String> signedParams = new TreeMap<>();
        signedParams.put("folder", folder);
        signedParams.put("overwrite", "true");
        signedParams.put("public_id", publicId);
        signedParams.put("timestamp", String.valueOf(timestamp));
        if (toWebp) {
            signedParams.put("format", "webp");
        }

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        signedParams.forEach(body::add);
        body.add("api_key", apiKey);
        body.add("signature", sign(signedParams));
        body.add("file", new ByteArrayResource(bytes) {
            @Override
            public String getFilename() {
                return publicId;
            }
        });

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        String url = "https://api.cloudinary.com/v1_1/" + cloudName + "/image/upload";
        try {
            String response = restTemplate.postForObject(url, new HttpEntity<>(body, headers), String.class);
            JsonNode json = objectMapper.readTree(response);
            return new UploadResult(
                    json.path("secure_url").asText(),
                    json.path("public_id").asText(),
                    json.path("width").asInt(0),
                    json.path("height").asInt(0)
            );
        } catch (Exception e) {
            throw new IllegalStateException("Upload Cloudinary thất bại: " + e.getMessage(), e);
        }
    }

    String sign(Map<String, String> sortedParams) {
        StringBuilder toSign = new StringBuilder();
        sortedParams.forEach((k, v) -> {
            if (!toSign.isEmpty()) toSign.append('&');
            toSign.append(k).append('=').append(v);
        });
        toSign.append(apiSecret);
        try {
            MessageDigest sha1 = MessageDigest.getInstance("SHA-1");
            return HexFormat.of().formatHex(sha1.digest(toSign.toString().getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("Không tạo được chữ ký Cloudinary", e);
        }
    }

    public record UploadResult(String secureUrl, String publicId, int width, int height) {}
}
