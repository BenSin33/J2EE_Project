package com.manga.notification.controller;

import com.manga.notification.service.ChapterNotificationService;
import com.manga.notification.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/internal")
@RequiredArgsConstructor
public class InternalMailNotificationController {

    private final EmailService emailService;
    private final ChapterNotificationService chapterNotificationService;

    public record WelcomeMailRequest(String email, String username) {}
    public record OtpMailRequest(String email, String otpCode, String username) {}
    public record PaymentReceiptMailRequest(String email, String username, Long amount, Long coins, String txnRef) {}

    @PostMapping("/mail/welcome")
    public ResponseEntity<Map<String, String>> sendWelcome(@RequestBody WelcomeMailRequest req) {
        emailService.sendWelcomeEmail(req.email(), req.username());
        return ResponseEntity.ok(Map.of("status", "QUEUED"));
    }

    @PostMapping("/mail/otp")
    public ResponseEntity<Map<String, String>> sendOtp(@RequestBody OtpMailRequest req) {
        emailService.sendOtpEmail(req.email(), req.otpCode(), req.username());
        return ResponseEntity.ok(Map.of("status", "QUEUED"));
    }

    @PostMapping("/mail/payment-receipt")
    public ResponseEntity<Map<String, String>> sendReceipt(@RequestBody PaymentReceiptMailRequest req) {
        emailService.sendPaymentReceiptEmail(req.email(), req.username(), req.amount(), req.coins(), req.txnRef());
        return ResponseEntity.ok(Map.of("status", "QUEUED"));
    }

    @PostMapping("/notifications/enqueue/{chapterId}")
    public ResponseEntity<Map<String, Object>> enqueueChapter(@PathVariable UUID chapterId) {
        boolean queued = chapterNotificationService.enqueueFirstPublication(chapterId);
        return ResponseEntity.ok(Map.of("queued", queued));
    }
}

