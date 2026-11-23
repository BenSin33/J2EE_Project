package com.manga.payment.client;

import com.manga.payment.dto.PaymentDtos.PaymentReceiptMailRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@FeignClient(name = "notification-mail-service")
public interface NotificationMailClient {

    @PostMapping("/api/internal/mail/payment-receipt")
    Map<String, String> sendPaymentReceipt(@RequestBody PaymentReceiptMailRequest request);
}

