package com.manga.manga_backend_services.service;

import com.manga.manga_backend_services.config.VNPayConfig;
import com.manga.manga_backend_services.dto.request.CreatePaymentRequest;
import com.manga.manga_backend_services.dto.response.PaymentPackageResponse;
import com.manga.manga_backend_services.dto.response.PaymentTransactionResponse;
import com.manga.manga_backend_services.dto.response.PaymentUrlResponse;
import com.manga.manga_backend_services.entity.PaymentTransaction;
import com.manga.manga_backend_services.entity.User;
import com.manga.manga_backend_services.repository.PaymentTransactionRepository;
import com.manga.manga_backend_services.repository.UserRepository;
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
import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final VNPayConfig vnPayConfig;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    /**
     * Tạo URL thanh toán VNPay Sandbox
     */
    @Transactional
    public PaymentUrlResponse createPaymentUrl(User user, CreatePaymentRequest request, HttpServletRequest httpRequest) {
        long amount = request.getAmount();
        long coins = calculateCoins(amount, request.getCoins());
        String orderInfo = request.getOrderInfo() != null && !request.getOrderInfo().isBlank()
                ? request.getOrderInfo().trim()
                : "Nap " + coins + " xu MangaHub";

        String txnRef = System.currentTimeMillis() + VNPayConfig.getRandomNumber(4);

        // Lưu trước transaction ở trạng thái PENDING
        PaymentTransaction transaction = PaymentTransaction.builder()
                .user(user)
                .amount(amount)
                .coinsAdded(coins)
                .orderInfo(orderInfo)
                .txnRef(txnRef)
                .status("PENDING")
                .bankCode(request.getBankCode())
                .build();
        paymentTransactionRepository.save(transaction);

        // Chuẩn bị tham số VNPay
        Map<String, String> vnpParams = new HashMap<>();
        vnpParams.put("vnp_Version", VNPayConfig.VNP_VERSION);
        vnpParams.put("vnp_Command", VNPayConfig.VNP_COMMAND);
        vnpParams.put("vnp_TmnCode", vnPayConfig.getVnpTmnCode());
        vnpParams.put("vnp_Amount", String.valueOf(amount * 100)); // VNPay tính theo đơn vị hào (x100)
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

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnpCreateDate = formatter.format(cld.getTime());
        vnpParams.put("vnp_CreateDate", vnpCreateDate);

        cld.add(Calendar.MINUTE, 15);
        String vnpExpireDate = formatter.format(cld.getTime());
        vnpParams.put("vnp_ExpireDate", vnpExpireDate);

        // Sắp xếp tham số theo alphabet
        List<String> fieldNames = new ArrayList<>(vnpParams.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnpParams.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                // Build hash data
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));

                // Build query
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));

                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }

        String queryUrl = query.toString();
        String vnpSecureHash = VNPayConfig.hmacSHA512(vnPayConfig.getVnpHashSecret(), hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnpSecureHash;
        String paymentUrl = vnPayConfig.getVnpPayUrl() + "?" + queryUrl;

        log.info("Đã tạo link thanh toán VNPay cho user [{}], txnRef: {}, amount: {}", user.getUsername(), txnRef, amount);

        return PaymentUrlResponse.builder()
                .paymentUrl(paymentUrl)
                .txnRef(txnRef)
                .amount(amount)
                .coins(coins)
                .build();
    }

    /**
     * Xử lý kết quả trả về từ VNPay (Callback / Return URL)
     */
    @Transactional
    public Map<String, Object> handleVNPayCallback(Map<String, String> queryParams) {
        Map<String, Object> result = new HashMap<>();

        Map<String, String> fields = new HashMap<>();
        for (Map.Entry<String, String> entry : queryParams.entrySet()) {
            fields.put(entry.getKey(), entry.getValue());
        }

        String vnpSecureHash = fields.remove("vnp_SecureHash");
        fields.remove("vnp_SecureHashType");

        // Kiểm tra chữ ký hash
        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = fields.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                hashData.append(fieldName).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                if (itr.hasNext()) {
                    hashData.append('&');
                }
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
            // Thanh toán thành công!
            if (!"SUCCESS".equals(tx.getStatus())) {
                tx.setStatus("SUCCESS");
                paymentTransactionRepository.save(tx);

                // Cộng xu và gia hạn VIP cho User
                User user = tx.getUser();
                long currentCoins = user.getCoins() != null ? user.getCoins() : 0L;
                user.setCoins(currentCoins + tx.getCoinsAdded());

                // Nếu nạp từ 50,000 VND trở lên -> tặng gói VIP
                if (tx.getAmount() >= 50000L) {
                    user.setIsVip(true);
                    OffsetDateTime currentVipUntil = user.getVipUntil();
                    OffsetDateTime baseTime = (currentVipUntil != null && currentVipUntil.isAfter(OffsetDateTime.now()))
                            ? currentVipUntil : OffsetDateTime.now();
                    user.setVipUntil(baseTime.plusDays(30));
                }

                userRepository.save(user);

                // Gửi email biên lai xác nhận (Spring Email - Yêu cầu 5)
                try {
                    emailService.sendPaymentReceiptEmail(user.getEmail(), user.getUsername(), tx.getAmount(), tx.getCoinsAdded(), tx.getTxnRef());
                } catch (Exception e) {
                    log.warn("Không thể gửi email biên lai thanh toán: {}", e.getMessage());
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

    /**
     * Lấy lịch sử giao dịch của user
     */
    public Page<PaymentTransactionResponse> getUserTransactions(User user, Pageable pageable) {
        return paymentTransactionRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable)
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

    /**
     * Danh sách các gói nạp xu
     */
    public List<PaymentPackageResponse> getPackages() {
        return List.of(
                PaymentPackageResponse.builder()
                        .id("pkg_10k")
                        .name("Túi Xu Đồng")
                        .amount(10000L)
                        .coins(100L)
                        .bonus("Cơ bản")
                        .popular(false)
                        .build(),
                PaymentPackageResponse.builder()
                        .id("pkg_20k")
                        .name("Túi Xu Bạc")
                        .amount(20000L)
                        .coins(220L)
                        .bonus("+10% Xu thưởng")
                        .popular(false)
                        .build(),
                PaymentPackageResponse.builder()
                        .id("pkg_50k")
                        .name("Rương Xu Vàng + VIP")
                        .amount(50000L)
                        .coins(600L)
                        .bonus("+20% Xu + 30 ngày VIP 👑")
                        .popular(true)
                        .build(),
                PaymentPackageResponse.builder()
                        .id("pkg_100k")
                        .name("Kho Báu Kim Cương")
                        .amount(100000L)
                        .coins(1300L)
                        .bonus("+30% Xu + 60 ngày VIP 👑")
                        .popular(false)
                        .build()
        );
    }

    private long calculateCoins(long amount, Long customCoins) {
        if (customCoins != null && customCoins > 0) {
            return customCoins;
        }
        if (amount >= 100000L) return 1300L;
        if (amount >= 50000L) return 600L;
        if (amount >= 20000L) return 220L;
        if (amount >= 10000L) return 100L;
        return amount / 100L;
    }
}
