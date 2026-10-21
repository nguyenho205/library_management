package com.fresher.library.service.impl;

import com.fresher.library.service.EmailService;
import com.fresher.library.exception.EmailDeliveryException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.mail.MailException;
import org.springframework.stereotype.Service;

/**
 * Gửi mã xác thực đăng ký, đặt lại mật khẩu và đổi email.
 * Trong moi truong dev/chua cau hinh SMTP that, he thong van log noi dung mail ra console/log file
 * de co the test luong nghiep vu ma khong can SMTP server that.
 */
@Service
@RequiredArgsConstructor
@Log4j2
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:no-reply@library.local}")
    private String fromAddress;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Override
    public void sendVerificationEmail(String toEmail, String code) {
        String subject = "[Thư viện] Mã xác thực tài khoản";
        String content = "Xin chào,<br/>Mã xác thực email của bạn là: "
                + "<strong style=\"font-size:24px;letter-spacing:4px\">" + code + "</strong><br/>"
                + "Mã có hiệu lực trong 10 phút. Nếu bạn không đăng ký tài khoản, hãy bỏ qua email này.";
        send(toEmail, subject, content);
    }

    @Override
    public void sendPasswordResetCode(String toEmail, String code) {
        String subject = "[Thư viện] Mã đặt lại mật khẩu";
        String content = "Bạn vừa yêu cầu đặt lại mật khẩu.<br/>Mã xác thực của bạn là: "
                + "<strong style=\"font-size:24px;letter-spacing:4px\">" + code + "</strong><br/>"
                + "Mã có hiệu lực trong 10 phút. Nếu không phải bạn yêu cầu, vui lòng bỏ qua email này.";
        send(toEmail, subject, content);
    }

    @Override
    public void sendChangeEmailCode(String newEmail, String code) {
        String subject = "[Thư viện] Mã xác nhận đổi email";
        String content = "Bạn vừa yêu cầu đổi email đăng nhập sang địa chỉ này.<br/>Mã xác nhận là: "
                + "<strong style=\"font-size:24px;letter-spacing:4px\">" + code + "</strong><br/>"
                + "Mã có hiệu lực trong 10 phút. Nếu không phải bạn yêu cầu, vui lòng bỏ qua email này.";
        send(newEmail, subject, content);
    }

    private void send(String to, String subject, String htmlContent) {
        if (!mailEnabled) {
            // Chua cau hinh SMTP that (vd moi truong sandbox/demo) -> ghi log noi dung mail de van test duoc luong nghiep vu
            log.info("[MAIL-SIMULATED] to={} | subject={} | content={}", to, subject, htmlContent);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Da gui mail toi {} - subject: {}", to, subject);
        } catch (MessagingException | MailException e) {
            log.error("Không gửi được email tới {}. Hãy kiểm tra cấu hình SMTP và Google App Password.", to);
            throw new EmailDeliveryException(e);
        }
    }
}
