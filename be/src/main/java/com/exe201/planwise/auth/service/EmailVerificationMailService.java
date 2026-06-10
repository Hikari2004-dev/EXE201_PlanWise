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
public class EmailVerificationMailService {

    private final JavaMailSender mailSender;
    private final AppProperties appProperties;

    public void sendVerificationEmail(String recipientEmail, String fullName, String token) {
        String verificationUrl = appProperties.getMail().buildVerificationUrl(token);
        String displayName = (fullName == null || fullName.isBlank()) ? recipientEmail : fullName;

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setTo(recipientEmail);
            helper.setFrom(appProperties.getMail().getFrom());
            helper.setSubject("PlanWise Corp - Xác thực tài khoản");
            helper.setText(buildBody(displayName, verificationUrl), true);

            mailSender.send(message);
            log.info("Sent verification email to {}", recipientEmail);
        } catch (MessagingException e) {
            throw new IllegalStateException("Failed to send verification email", e);
        }
    }

    private String buildBody(String displayName, String verificationUrl) {
        return """
                <div style=\"font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;\">
                  <p>Xin chào %s,</p>
                  <p>Cảm ơn bạn đã đăng ký PlanWise Corp. Vui lòng xác thực email của bạn bằng nút bên dưới:</p>
                  <p style=\"margin: 24px 0;\">
                    <a href=\"%s\" style=\"display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;\">Xác thực email</a>
                  </p>
                  <p>Liên kết có hiệu lực trong %d phút.</p>
                  <p>Nếu bạn không tạo tài khoản này, bạn có thể bỏ qua email này.</p>
                  <p>Trân trọng,<br/>PlanWise Corp</p>
                </div>
                """.formatted(
                displayName,
                verificationUrl,
                appProperties.getMail().getVerificationTokenExpirationMinutes()
        );
    }
}
