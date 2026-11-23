package com.manga.payment.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

public class PaymentDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreatePaymentRequest {
        @NotNull(message = "Số tiền không được để trống")
        @Min(value = 10000, message = "Số tiền tối thiểu là 10,000 VND")
        private Long amount;
        private Long coins;
        private String orderInfo;
        private String bankCode;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentPackageResponse {
        private String id;
        private String name;
        private Long amount;
        private Long coins;
        private String bonus;
        private Boolean popular;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentUrlResponse {
        private String paymentUrl;
        private String txnRef;
        private Long amount;
        private Long coins;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentTransactionResponse {
        private UUID id;
        private Long amount;
        private Long coinsAdded;
        private String orderInfo;
        private String txnRef;
        private String vnpTransactionNo;
        private String bankCode;
        private String status;
        private OffsetDateTime createdAt;
    }

    public record CoreUserDto(UUID id, String username, String email, String role, Long coins, Boolean isVip) {}
    public record CreditUserRequest(Long coinsAdded, Integer vipDays) {}
    public record PaymentReceiptMailRequest(String email, String username, Long amount, Long coins, String txnRef) {}
}

