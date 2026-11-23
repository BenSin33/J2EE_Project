package com.manga.payment.controller;

import com.manga.payment.dto.PaymentDtos.*;
import com.manga.payment.security.JwtUserExtractor;
import com.manga.payment.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/payment", "/api/payment"})
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final JwtUserExtractor jwtUserExtractor;

    @GetMapping("/packages")
    public ResponseEntity<List<PaymentPackageResponse>> getPackages() {
        return ResponseEntity.ok(paymentService.getPackages());
    }

    @PostMapping("/create")
    public ResponseEntity<PaymentUrlResponse> createPayment(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody CreatePaymentRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        var user = jwtUserExtractor.requireUser(authHeader, httpResponse);
        return ResponseEntity.ok(paymentService.createPaymentUrl(user.id(), user.username(), request, httpRequest));
    }

    @GetMapping("/vnpay-callback")
    public ResponseEntity<Map<String, Object>> vnpayCallback(@RequestParam Map<String, String> queryParams) {
        return ResponseEntity.ok(paymentService.handleVNPayCallback(queryParams));
    }

    @GetMapping("/history")
    public ResponseEntity<Page<PaymentTransactionResponse>> getHistory(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit,
            HttpServletResponse httpResponse
    ) {
        var user = jwtUserExtractor.requireUser(authHeader, httpResponse);
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, limit));
        return ResponseEntity.ok(paymentService.getUserTransactions(user.id(), pageable));
    }
}

