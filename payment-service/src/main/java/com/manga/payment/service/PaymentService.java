package com.manga.payment.service;

import com.manga.payment.client.CoreUserClient;
import com.manga.payment.client.NotificationMailClient;
import com.manga.payment.config.VNPayConfig;
import com.manga.payment.dto.PaymentDtos.*;
import com.manga.payment.entity.PaymentTransaction;
import com.manga.payment.repository.PaymentTransactionRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final VNPayConfig vnPayConfig;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final CoreUserClient coreUserClient;
    private final NotificationMailClient notificationMailClient;

    @Transactional
    public PaymentUrlResponse createPaymentUrl(UUID userId, String username, CreatePaymentRequest request, HttpServletRequest httpRequest) {
        long amount = request.getAmount();
        long coins = calculateCoins(amount, request.getCoins());
        String rawOrderInfo = request.getOrderInfo() != null && !request.getOrderInfo().isBlank()
                ? request.getOrderInfo().trim()
                : "Nap " + coins + " xu MangaHub";
        String orderInfo = sanitizeVnpOrderInfo(rawOrderInfo, coins);

        String txnRef = System.currentTimeMillis() + VNPayConfig.getRandomNumber(4);

        PaymentTransaction transaction = PaymentTransaction.builder()
                .userId(userId)
                .amount(amount)
                .coinsAdded(coins)
                .orderInfo(orderInfo)
                .txnRef(txnRef)
                .status("PENDING")
                .bankCode(request.getBankCode())
                .build();
        paymentTransactionRepository.save(transaction);

        Map<String, String> vnpParams = new HashMap<>();
        vnpParams.put("vnp_Version", VNPayConfig.VNP_VERSION);
        vnpParams.put("vnp_Command", VNPayConfig.VNP_COMMAND);
        vnpParams.put("vnp_TmnCode", vnPayConfig.getVnpTmnCode());
        vnpParams.put("vnp_Amount", String.valueOf(amount * 100));
        vnpParams.put("vnp_CurrCode", "VND");
        vnpParams.put("vnp_TxnRef", txnRef);
        vnpParams.put("vnp_OrderInfo", orderInfo);
        vnpParams.put("vnp_OrderType", VNPayConfig.VNP_ORDER_TYPE);
        vnpParams.put("vnp_Locale", "vn");
        vnpParams.put("vnp_ReturnUrl", vnPayConfig.getVnpReturnUrl());
        vnpParams.put("vnp_IpAddr", VNPayConfig.getIpAddress(httpRequest));

        if (request.getBankCode() != null && !request.getBankCode().isBlank()) {
            vnpParams.put("vnp_BankCode", request.getBankCode().trim());
        }

        java.time.ZonedDateTime nowVn = java.time.ZonedDateTime.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"));
        java.time.format.DateTimeFormatter vnpFormatter = java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        vnpParams.put("vnp_CreateDate", nowVn.format(vnpFormatter));
        vnpParams.put("vnp_ExpireDate", nowVn.plusMinutes(15).format(vnpFormatter));

        List<String> fieldNames = new ArrayList<>(vnpParams.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnpParams.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                String encodedValue = URLEncoder.encode(fieldValue, StandardCharsets.UTF_8);
                hashData.append(fieldName).append('=').append(encodedValue);
                query.append(URLEncoder.encode(fieldName, StandardCharsets.UTF_8))
                        .append('=')
                        .append(encodedValue);
                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }

        String vnpSecureHash = VNPayConfig.hmacSHA512(vnPayConfig.getVnpHashSecret(), hashData.toString());
        String paymentUrl = vnPayConfig.getVnpPayUrl() + "?" + query + "&vnp_SecureHash=" + vnpSecureHash;

        log.info("[Payment-Service] Tạo link VNPay cho user [{}], txnRef: {}, amount: {}", username, txnRef, amount);

        return PaymentUrlResponse.builder()
                .paymentUrl(paymentUrl)
                .txnRef(txnRef)
                .amount(amount)
                .coins(coins)
                .build();
    }

    @Transactional
    public Map<String, Object> handleVNPayCallback(Map<String, String> queryParams) {
        Map<String, Object> result = new HashMap<>();
        Map<String, String> fields = new HashMap<>(queryParams);

        String vnpSecureHash = fields.remove("vnp_SecureHash");
        fields.remove("vnp_SecureHashType");

        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = fields.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                hashData.append(fieldName).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
                if (itr.hasNext()) hashData.append('&');
            }
        }

        String signValue = VNPayConfig.hmacSHA512(vnPayConfig.getVnpHashSecret(), hashData.toString());
        boolean isValidSignature = signValue.equalsIgnoreCase(vnpSecureHash);

        String txnRef = queryParams.get("vnp_TxnRef");
        String responseCode = queryParams.get("vnp_ResponseCode");
        String transactionNo = queryParams.get("vnp_TransactionNo");
        String bankCode = queryParams.get("vnp_BankCode");

        Optional<PaymentTransaction> txOpt = paymentTransactionRepository.findByTxnRef(txnRef);
        if (txOpt.isEmpty()) {
            result.put("status", "FAILED");
            result.put("message", "Không tìm thấy mã giao dịch: " + txnRef);
            return result;
        }

        PaymentTransaction tx = txOpt.get();
        tx.setVnpTransactionNo(transactionNo);
        tx.setBankCode(bankCode);

        if (!isValidSignature) {
            tx.setStatus("FAILED");
            paymentTransactionRepository.save(tx);
            result.put("status", "FAILED");
            result.put("message", "Chữ ký checksum VNPay không hợp lệ!");
            return result;
        }

        if ("00".equals(responseCode)) {
            if (!"SUCCESS".equals(tx.getStatus())) {
                tx.setStatus("SUCCESS");
                paymentTransactionRepository.save(tx);

                // 1. Gọi manga-core-service qua OpenFeign để cộng Xu & gia hạn VIP
                int vipDays = tx.getAmount() >= 100000L ? 60 : (tx.getAmount() >= 50000L ? 30 : 0);
                CoreUserDto updatedUser = null;
                try {
                    updatedUser = coreUserClient.creditUser(tx.getUserId(), new CreditUserRequest(tx.getCoinsAdded(), vipDays));
                } catch (Exception e) {
                    log.error("[Payment-Service] Lỗi gọi OpenFeign sang manga-core-service cộng xu: {}", e.getMessage());
                }

                // 2. Gọi notification-mail-service qua OpenFeign để gửi email biên lai
                if (updatedUser != null && updatedUser.email() != null) {
                    try {
                        notificationMailClient.sendPaymentReceipt(new PaymentReceiptMailRequest(
                                updatedUser.email(),
                                updatedUser.username(),
                                tx.getAmount(),
                                tx.getCoinsAdded(),
                                tx.getTxnRef()
                        ));
                    } catch (Exception e) {
                        log.warn("[Payment-Service] Lỗi gọi OpenFeign sang notification-mail-service: {}", e.getMessage());
                    }
                }
            }

            result.put("status", "SUCCESS");
            result.put("message", "Giao dịch thành công!");
            result.put("txnRef", tx.getTxnRef());
            result.put("amount", tx.getAmount());
            result.put("coinsAdded", tx.getCoinsAdded());
            result.put("vnpTransactionNo", transactionNo);
        } else {
            tx.setStatus("FAILED");
            paymentTransactionRepository.save(tx);
            result.put("status", "FAILED");
            result.put("message", "Giao dịch thất bại với mã lỗi VNPay: " + responseCode);
            result.put("txnRef", tx.getTxnRef());
        }

        return result;
    }

    public Page<PaymentTransactionResponse> getUserTransactions(UUID userId, Pageable pageable) {
        return paymentTransactionRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(tx -> PaymentTransactionResponse.builder()
                        .id(tx.getId())
                        .amount(tx.getAmount())
                        .coinsAdded(tx.getCoinsAdded())
                        .orderInfo(tx.getOrderInfo())
                        .txnRef(tx.getTxnRef())
                        .vnpTransactionNo(tx.getVnpTransactionNo())
                        .bankCode(tx.getBankCode())
                        .status(tx.getStatus())
                        .createdAt(tx.getCreatedAt())
                        .build());
    }

    public List<PaymentPackageResponse> getPackages() {
        return List.of(
                PaymentPackageResponse.builder().id("pkg_10k").name("Túi Xu Đồng").amount(10000L).coins(100L).bonus("Cơ bản").popular(false).build(),
                PaymentPackageResponse.builder().id("pkg_20k").name("Túi Xu Bạc").amount(20000L).coins(220L).bonus("+10% Xu thưởng").popular(false).build(),
                PaymentPackageResponse.builder().id("pkg_50k").name("Rương Xu Vàng + VIP").amount(50000L).coins(600L).bonus("+20% Xu + 30 ngày VIP 👑").popular(true).build(),
                PaymentPackageResponse.builder().id("pkg_100k").name("Kho Báu Kim Cương").amount(100000L).coins(1300L).bonus("+30% Xu + 60 ngày VIP 👑").popular(false).build()
        );
    }

    private long calculateCoins(long amount, Long customCoins) {
        if (customCoins != null && customCoins > 0) return customCoins;
        if (amount >= 100000L) return 1300L;
        if (amount >= 50000L) return 600L;
        if (amount >= 20000L) return 220L;
        if (amount >= 10000L) return 100L;
        return amount / 100L;
    }

    private String sanitizeVnpOrderInfo(String input, long coins) {
        String normalized = java.text.Normalizer.normalize(input, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .replaceAll("[^a-zA-Z0-9 ]", " ")
                .replaceAll("\\s+", " ")
                .trim();
        return normalized.isEmpty() ? ("Nap " + coins + " xu MangaHub") : normalized;
    }
}

