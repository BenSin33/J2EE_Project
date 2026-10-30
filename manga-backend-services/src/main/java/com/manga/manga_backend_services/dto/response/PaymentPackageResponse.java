package com.manga.manga_backend_services.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentPackageResponse {
    private String id;
    private String name;
    private Long amount;
    private Long coins;
    private String bonus;
    private Boolean popular;
}
