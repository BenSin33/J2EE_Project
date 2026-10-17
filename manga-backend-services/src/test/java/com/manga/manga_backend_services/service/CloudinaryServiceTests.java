package com.manga.manga_backend_services.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.TreeMap;

import static org.junit.jupiter.api.Assertions.*;

class CloudinaryServiceTests {

    @Test
    void disabledWhenCredentialsMissing() {
        var service = new CloudinaryService(new ObjectMapper(), "demo", "", "", "mangahub");
        assertFalse(service.isEnabled());
        assertThrows(IllegalStateException.class, () -> service.upload(new byte[]{1}, "covers", "x", true));
    }

    @Test
    void signatureMatchesCloudinaryDocumentationExample() {
        // Ví dụ trong tài liệu "Authentication signatures" của Cloudinary, api_secret = abcd
        var service = new CloudinaryService(new ObjectMapper(), "demo", "1234", "abcd", "mangahub");
        Map<String, String> params = new TreeMap<>();
        params.put("eager", "w_400,h_300,c_pad|w_260,h_200,c_crop");
        params.put("public_id", "sample_image");
        params.put("timestamp", "1315060510");
        assertEquals("bfd09f95f331f558cbd1320e67aa8d488770583e", service.sign(params));
    }
}
