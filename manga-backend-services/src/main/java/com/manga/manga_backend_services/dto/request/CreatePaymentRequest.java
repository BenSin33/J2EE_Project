package com.manga.manga_backend_services.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePaymentRequest {

    @NotNull(message = "Số tiền không được để trống")
    @Min(value = 10000, message = "Số tiền tối thiểu là 10,000 VND")
    private Long amount;

    private Long coins;

    private String orderInfo;

    private String bankCode; // VNPAYQR, VNBANK, INTCARD, hoặc null (để người dùng tự chọn tại cổng VNPay)
}
