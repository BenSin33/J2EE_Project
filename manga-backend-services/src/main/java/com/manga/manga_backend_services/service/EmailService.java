package com.manga.manga_backend_services.service;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.text.NumberFormat;
import java.util.Locale;

@Service
@Slf4j
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.mail.enabled:true}")
    private boolean mailEnabled;

    @Value("${app.mail.from:MangaHub <mangahub.j2ee@gmail.com>}")
    private String fromAddress;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    /**
     * Gửi email chung dạng HTML
     */
    @Async
    public void sendHtmlEmail(String toEmail, String subject, String htmlContent) {
        if (!mailEnabled) {
            log.info("[Spring Email DISABLED] Bỏ qua gửi email tới: {}, Tiêu đề: {}", toEmail, subject);
            return;
        }

        if (mailSender == null || mailUsername == null || mailUsername.isBlank()) {
            log.warn("[Spring Email MOCK] Chưa cấu hình SPRING_MAIL_USERNAME hoặc JavaMailSender. Nội dung email gửi tới [{}]:\n{}", toEmail, htmlContent);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("[Spring Email] Đã gửi thành công email tới: {}", toEmail);
        } catch (Exception e) {
            log.error("[Spring Email] Lỗi khi gửi email tới {}: {}", toEmail, e.getMessage());
        }
    }

    /**
     * Gửi mã OTP xác nhận tài khoản hoặc quên mật khẩu
     */
    public void sendOtpEmail(String toEmail, String otpCode, String username) {
        String safeName = (username != null && !username.isBlank()) ? username : "Độc giả";
        String subject = "MangaHub - Mã xác thực OTP đặt lại mật khẩu: " + otpCode;

        String html = """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
                .card { max-width: 520px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5); }
                .header { background: linear-gradient(135deg, #6366f1 0%%, #a855f7 100%%); padding: 30px 20px; text-align: center; }
                .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 1px; }
                .content { padding: 30px; text-align: center; }
                .otp-box { background: #0f172a; border: 2px dashed #6366f1; border-radius: 12px; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #38bdf8; padding: 15px 25px; display: inline-block; margin: 25px 0; }
                .footer { font-size: 12px; color: #94a3b8; text-align: center; padding-bottom: 20px; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="header">
                  <h1>MangaHub Service</h1>
                </div>
                <div class="content">
                  <h2>Xin chào %s!</h2>
                  <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với email này.</p>
                  <p>Mã OTP bảo mật của bạn có hiệu lực trong <strong>10 phút</strong>:</p>
                  <div class="otp-box">%s</div>
                  <p style="font-size: 13px; color: #94a3b8;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc đổi mật khẩu để bảo vệ tài khoản.</p>
                </div>
                <div class="footer">
                  &copy; 2026 MangaHub J2EE Project. All rights reserved.
                </div>
              </div>
            </body>
            </html>
            """.formatted(safeName, otpCode);

        sendHtmlEmail(toEmail, subject, html);
    }

    /**
     * Gửi email chào mừng khi đăng ký tài khoản thành công
     */
    public void sendWelcomeEmail(String toEmail, String username) {
        String safeName = (username != null && !username.isBlank()) ? username : "Độc giả mới";
        String subject = "Chào mừng bạn đến với MangaHub!";

        String html = """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
                .card { max-width: 520px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; }
                .header { background: linear-gradient(135deg, #ec4899 0%%, #8b5cf6 100%%); padding: 30px 20px; text-align: center; }
                .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; }
                .content { padding: 30px; line-height: 1.6; }
                .btn { display: inline-block; background: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="header">
                  <h1>MangaHub Community</h1>
                </div>
                <div class="content">
                  <h2>Chào mừng %s! 🎉</h2>
                  <p>Tài khoản của bạn đã được đăng ký thành công trên nền tảng MangaHub.</p>
                  <p>Tại MangaHub, bạn có thể thỏa sức đọc hàng ngàn đầu truyện tranh chất lượng cao, lưu lịch sử đọc, đánh giá bình luận và theo dõi các chương mới nhất.</p>
                  <p>Chúc bạn có những giây phút thư giãn tuyệt vời!</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(safeName);

        sendHtmlEmail(toEmail, subject, html);
    }

    /**
     * Gửi email biên lai nạp tiền VNPay thành công
     */
    public void sendPaymentReceiptEmail(String toEmail, String username, Long amount, Long coins, String txnRef) {
        String safeName = (username != null && !username.isBlank()) ? username : "Độc giả";
        String formattedAmount = NumberFormat.getCurrencyInstance(new Locale("vi", "VN")).format(amount != null ? amount : 0);
        String subject = "MangaHub - Xác nhận nạp xu thành công: " + txnRef;

        String html = """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
                .card { max-width: 520px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; }
                .header { background: linear-gradient(135deg, #10b981 0%%, #06b6d4 100%%); padding: 25px 20px; text-align: center; }
                .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; }
                .content { padding: 30px; line-height: 1.6; }
                .table-info { width: 100%%; margin: 20px 0; border-collapse: collapse; }
                .table-info td { padding: 10px 0; border-bottom: 1px solid #334155; }
                .table-info td:last-child { text-align: right; font-weight: bold; }
                .coins-badge { color: #f59e0b; font-size: 18px; font-weight: 800; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="header">
                  <h1>Thanh Toán VNPay Thành Công! ✅</h1>
                </div>
                <div class="content">
                  <p>Xin chào <strong>%s</strong>,</p>
                  <p>Giao dịch nạp xu vào tài khoản của bạn qua cổng <strong>VNPay</strong> đã hoàn tất thành công.</p>
                  
                  <table class="table-info">
                    <tr><td>Mã giao dịch (TxnRef):</td><td>%s</td></tr>
                    <tr><td>Số tiền thanh toán:</td><td style="color: #34d399;">%s</td></tr>
                    <tr><td>Số xu nhận được:</td><td class="coins-badge">+%d Xu 🪙</td></tr>
                  </table>

                  <p>Bạn có thể sử dụng xu này để mở khóa các chương truyện VIP hoặc tặng quà cho nhóm dịch.</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(safeName, txnRef, formattedAmount, coins != null ? coins : 0);

        sendHtmlEmail(toEmail, subject, html);
    }
}
