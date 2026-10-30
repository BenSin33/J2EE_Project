package com.manga.manga_backend_services.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentTransactionResponse {
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
