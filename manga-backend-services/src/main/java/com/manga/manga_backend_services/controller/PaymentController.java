package com.manga.manga_backend_services.controller;

import com.manga.manga_backend_services.dto.request.CreatePaymentRequest;
import com.manga.manga_backend_services.dto.response.PaymentPackageResponse;
import com.manga.manga_backend_services.dto.response.PaymentTransactionResponse;
import com.manga.manga_backend_services.dto.response.PaymentUrlResponse;
import com.manga.manga_backend_services.entity.User;
import com.manga.manga_backend_services.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/payment")
@RequiredArgsConstructor
@Tag(name = "Payment (VNPay)", description = "APIs thanh toán online qua cổng VNPay Sandbox (Yêu cầu 3)")
@CrossOrigin(origins = "http://localhost:3000")
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping("/packages")
    @Operation(summary = "Lấy danh sách các gói nạp Xu & VIP")
    public ResponseEntity<List<PaymentPackageResponse>> getPackages() {
        return ResponseEntity.ok(paymentService.getPackages());
    }

    @PostMapping("/create")
    @Operation(summary = "Tạo URL thanh toán VNPay Sandbox")
    public ResponseEntity<PaymentUrlResponse> createPayment(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreatePaymentRequest request,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(paymentService.createPaymentUrl(user, request, httpRequest));
    }

    @GetMapping("/vnpay-callback")
    @Operation(summary = "Tiếp nhận callback kết quả từ VNPay sau khi khách hàng thanh toán")
    public ResponseEntity<Map<String, Object>> vnpayCallback(@RequestParam Map<String, String> queryParams) {
        return ResponseEntity.ok(paymentService.handleVNPayCallback(queryParams));
    }

    @GetMapping("/history")
    @Operation(summary = "Lấy lịch sử giao dịch nạp tiền của người dùng hiện tại")
    public ResponseEntity<Page<PaymentTransactionResponse>> getHistory(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit
    ) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, limit));
        return ResponseEntity.ok(paymentService.getUserTransactions(user, pageable));
    }
}
