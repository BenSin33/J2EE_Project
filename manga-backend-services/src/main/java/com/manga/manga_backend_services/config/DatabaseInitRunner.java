package com.manga.manga_backend_services.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Tự động đồng bộ các bảng và cột phục vụ:
 * 1. Đăng nhập Google (auth_provider, provider_id)
 * 3. Thanh toán VNPay (coins, is_vip, vip_until, payment_transactions)
 * 5. Gửi email xác thực OTP (password_reset_tokens)
 */
@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class DatabaseInitRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            log.info("Đang kiểm tra và khởi tạo cấu trúc cơ sở dữ liệu cho OAuth, VNPay và Email...");

            // 1. Thêm cột vào bảng users nếu chưa có
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS coins BIGINT DEFAULT 0;");
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false;");
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS vip_until TIMESTAMP WITH TIME ZONE;");
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'LOCAL';");
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id VARCHAR(100);");

            // 2. Tạo bảng payment_transactions nếu chưa có
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS payment_transactions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID NOT NULL,
                    amount BIGINT NOT NULL,
                    coins_added BIGINT DEFAULT 0,
                    order_info TEXT,
                    txn_ref VARCHAR(100) NOT NULL UNIQUE,
                    vnp_transaction_no VARCHAR(100),
                    bank_code VARCHAR(50),
                    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_payment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
            """);

            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_payment_user_id ON payment_transactions(user_id);");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_payment_txn_ref ON payment_transactions(txn_ref);");

            // 3. Tạo bảng password_reset_tokens phục vụ OTP email
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS password_reset_tokens (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    email VARCHAR(100) NOT NULL,
                    otp_code VARCHAR(10) NOT NULL,
                    expiry_time TIMESTAMP WITH TIME ZONE NOT NULL,
                    used BOOLEAN DEFAULT false,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """);

            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_pwd_reset_email ON password_reset_tokens(email);");

            log.info("Khởi tạo cấu trúc cơ sở dữ liệu bổ sung hoàn tất thành công!");
        } catch (Exception e) {
            log.warn("Lưu ý khi khởi tạo DB bổ sung (có thể đã tồn tại): {}", e.getMessage());
        }
    }
}
