package com.exe201.planwise.auth.service;

import com.exe201.planwise.config.AppProperties;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class PasswordResetMailService {

    private final JavaMailSender mailSender;
    private final AppProperties appProperties;

    public void sendPasswordResetEmail(String recipientEmail, String fullName, String token) {
        String resetUrl = appProperties.getMail().getVerificationBaseUrl()
                .replace("/verify-email", "/reset-password") + "?token=" + token;

        String displayName = (fullName == null || fullName.isBlank()) ? recipientEmail : fullName;

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setTo(recipientEmail);
            helper.setFrom(appProperties.getMail().getFrom());
            helper.setSubject("PlanWise Corp - Đặt lại mật khẩu");
            helper.setText(buildBody(displayName, resetUrl), true);

            mailSender.send(message);
            log.info("Sent password reset email to {}", recipientEmail);
        } catch (MessagingException e) {
            throw new IllegalStateException("Failed to send password reset email", e);
        }
    }

    private String buildBody(String displayName, String resetUrl) {
        return """
                <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
                  <p>Xin chào %s,</p>
                  <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản PlanWise Corp của bạn.</p>
                  <p>Vui lòng click vào nút bên dưới để đặt lại mật khẩu:</p>
                  <p style="margin: 24px 0;">
                    <a href="%s" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;">Đặt lại mật khẩu</a>
                  </p>
                  <p>Liên kết có hiệu lực trong 15 phút.</p>
                  <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.</p>
                  <p>Trân trọng,<br/>PlanWise Corp</p>
                </div>
                """.formatted(displayName, resetUrl);
    }
}
