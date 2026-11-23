package com.manga.manga_backend_services.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;
import java.util.UUID;

@FeignClient(name = "notification-mail-service")
public interface NotificationMailClient {

    record WelcomeMailRequest(String email, String username) {}
    record OtpMailRequest(String email, String otpCode, String username) {}
    record PaymentReceiptMailRequest(String email, String username, Long amount, Long coins, String txnRef) {}

    @PostMapping("/api/internal/mail/welcome")
    Map<String, String> sendWelcome(@RequestBody WelcomeMailRequest request);

    @PostMapping("/api/internal/mail/otp")
    Map<String, String> sendOtp(@RequestBody OtpMailRequest request);

    @PostMapping("/api/internal/mail/payment-receipt")
    Map<String, String> sendPaymentReceipt(@RequestBody PaymentReceiptMailRequest request);

    @PostMapping("/api/internal/notifications/enqueue/{chapterId}")
    Map<String, Object> enqueueChapter(@PathVariable("chapterId") UUID chapterId);
}

