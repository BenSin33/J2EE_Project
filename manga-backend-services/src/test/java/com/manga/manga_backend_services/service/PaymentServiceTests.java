package com.manga.manga_backend_services.service;

import com.manga.manga_backend_services.config.VNPayConfig;
import com.manga.manga_backend_services.dto.request.CreatePaymentRequest;
import com.manga.manga_backend_services.dto.response.PaymentUrlResponse;
import com.manga.manga_backend_services.entity.PaymentTransaction;
import com.manga.manga_backend_services.entity.User;
import com.manga.manga_backend_services.repository.PaymentTransactionRepository;
import com.manga.manga_backend_services.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PaymentServiceTests {

    private PaymentTransactionRepository paymentTransactionRepository;
    private UserRepository userRepository;
    private EmailService emailService;
    private VNPayConfig vnPayConfig;
    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentTransactionRepository = mock(PaymentTransactionRepository.class);
        userRepository = mock(UserRepository.class);
        emailService = mock(EmailService.class);
        vnPayConfig = new VNPayConfig();

        ReflectionTestUtils.setField(vnPayConfig, "vnpTmnCode", "CGXZLS0Z");
        ReflectionTestUtils.setField(vnPayConfig, "vnpHashSecret", "XNBCJFAKAZQSGZSSTGUBMVWFFWCGUSYQ");
        ReflectionTestUtils.setField(vnPayConfig, "vnpPayUrl", "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html");
        ReflectionTestUtils.setField(vnPayConfig, "vnpReturnUrl", "http://localhost:3000/payment/result");

        paymentService = new PaymentService(vnPayConfig, paymentTransactionRepository, userRepository, emailService);
    }

    @Test
    void testCreatePaymentUrlSuccess() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .username("testuser")
                .email("testuser@example.com")
                .coins(0L)
                .build();

        CreatePaymentRequest req = CreatePaymentRequest.builder()
                .amount(50000L)
                .orderInfo("Nap 600 xu MangaHub")
                .bankCode("NCB")
                .build();

        HttpServletRequest httpReq = mock(HttpServletRequest.class);
        when(httpReq.getRemoteAddr()).thenReturn("127.0.0.1");

        when(paymentTransactionRepository.save(any(PaymentTransaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        PaymentUrlResponse response = paymentService.createPaymentUrl(user, req, httpReq);

        assertNotNull(response);
        assertNotNull(response.getPaymentUrl());
        assertTrue(response.getPaymentUrl().contains("vnp_SecureHash"));
        assertTrue(response.getPaymentUrl().contains("vnp_Amount=5000000"));
        assertTrue(response.getPaymentUrl().contains("vnp_BankCode=NCB"));
        assertEquals(50000L, response.getAmount());
        assertEquals(600L, response.getCoins());
    }

    @Test
    void testHandleVNPayCallbackSuccess() {
        String txnRef = "1234567890";
        User user = User.builder()
                .id(UUID.randomUUID())
                .username("gamer")
                .email("gamer@gmail.com")
                .coins(50L)
                .build();

        PaymentTransaction tx = PaymentTransaction.builder()
                .id(UUID.randomUUID())
                .user(user)
                .amount(50000L)
                .coinsAdded(600L)
                .txnRef(txnRef)
                .status("PENDING")
                .build();

        when(paymentTransactionRepository.findByTxnRef(txnRef)).thenReturn(Optional.of(tx));

        // Chuẩn bị tham số callback hợp lệ
        Map<String, String> params = new HashMap<>();
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_Amount", "5000000");
        params.put("vnp_ResponseCode", "00");
        params.put("vnp_TransactionNo", "999888");
        params.put("vnp_BankCode", "NCB");

        // Tính secure hash chuẩn
        String hashData = "vnp_Amount=5000000&vnp_BankCode=NCB&vnp_ResponseCode=00&vnp_TransactionNo=999888&vnp_TxnRef=" + txnRef;
        String secureHash = VNPayConfig.hmacSHA512("XNBCJFAKAZQSGZSSTGUBMVWFFWCGUSYQ", hashData);
        params.put("vnp_SecureHash", secureHash);

        Map<String, Object> result = paymentService.handleVNPayCallback(params);

        assertEquals("SUCCESS", result.get("status"));
        assertEquals("SUCCESS", tx.getStatus());
        assertEquals(650L, user.getCoins()); // 50 + 600
        assertTrue(user.getIsVip());
        assertNotNull(user.getVipUntil());

        verify(paymentTransactionRepository).save(tx);
        verify(userRepository).save(user);
        verify(emailService).sendPaymentReceiptEmail(eq("gamer@gmail.com"), eq("gamer"), eq(50000L), eq(600L), eq(txnRef));
    }

    @Test
    void testGetPackages() {
        var pkgs = paymentService.getPackages();
        assertFalse(pkgs.isEmpty());
        assertEquals(4, pkgs.size());
    }
}
