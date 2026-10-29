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

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

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

    @Override
    public void sendDueReminderEmail(String toEmail, String memberName, String bookTitle, java.time.LocalDate dueDate, long daysRemainingOrOverdue, boolean isOverdue) {
        String greetingName = (memberName != null && !memberName.isBlank()) ? memberName : "Bạn đọc";
        String formattedDate = dueDate != null ? dueDate.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "hôm nay";

        String subject;
        String statusAlertHtml;

        if (isOverdue) {
            subject = "[Thư viện] CẢNH BÁO QUÁ HẠN: Sách \"" + bookTitle + "\" đã quá hạn " + daysRemainingOrOverdue + " ngày";
            long estimatedPenalty = daysRemainingOrOverdue * 5000;
            statusAlertHtml = "<div style=\"padding:14px 18px;background-color:#fff1f2;border-left:4px solid #be123c;border-radius:6px;color:#9f1239;margin:16px 0;\">"
                    + "<div style=\"font-weight:700;font-size:15px;margin-bottom:4px;\">⚠️ TRẠNG THÁI: ĐÃ QUÁ HẠN " + daysRemainingOrOverdue + " NGÀY</div>"
                    + "<div>Phí trễ hạn tạm tính: <strong style=\"color:#be123c;\">" + String.format("%,d đ", estimatedPenalty) + "</strong> (5.000 đ/cuốn/ngày).</div>"
                    + "<div style=\"margin-top:4px;\">Vui lòng hoàn trả ngay để tránh tăng thêm tiền phạt hoặc bị tạm khoá quyền mượn sách.</div>"
                    + "</div>";
        } else if (daysRemainingOrOverdue == 0) {
            subject = "[Thư viện] NHẮC NHỞ HÔM NAY: Đến hạn hoàn trả sách \"" + bookTitle + "\"";
            statusAlertHtml = "<div style=\"padding:14px 18px;background-color:#fffbeb;border-left:4px solid #b45309;border-radius:6px;color:#92400e;margin:16px 0;\">"
                    + "<div style=\"font-weight:700;font-size:15px;margin-bottom:4px;\">🔔 TRẠNG THÁI: HÔM NAY LÀ HẠN HOÀN TRẢ SÁCH</div>"
                    + "<div>Vui lòng hoàn trả sách trong ngày hôm nay (<strong>" + formattedDate + "</strong>) để tránh phát sinh phí trễ hạn (5.000 đ/cuốn/ngày).</div>"
                    + "</div>";
        } else {
            subject = "[Thư viện] NHẮC NHỞ: Sắp đến hạn hoàn trả sách \"" + bookTitle + "\"";
            statusAlertHtml = "<div style=\"padding:14px 18px;background-color:#f0fdfa;border-left:4px solid #0f766e;border-radius:6px;color:#115e59;margin:16px 0;\">"
                    + "<div style=\"font-weight:700;font-size:15px;margin-bottom:4px;\">⏳ TRẠNG THÁI: CÒN " + daysRemainingOrOverdue + " NGÀY NỮA ĐẾN HẠN TRẢ</div>"
                    + "<div>Hạn hoàn trả: <strong>" + formattedDate + "</strong>. Bạn vui lòng sắp xếp thời gian để hoàn trả sách đúng hạn.</div>"
                    + "</div>";
        }

        String htmlContent = "<div style=\"font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:8px;background-color:#ffffff;\">"
                + "<div style=\"border-bottom:2px solid #1e3a5f;padding-bottom:12px;margin-bottom:18px;\">"
                + "<h2 style=\"color:#1e3a5f;margin:0;font-size:20px;\">THƯ VIỆN ĐIỆN TỬ · THÔNG BÁO MƯỢN TRẢ</h2>"
                + "</div>"
                + "<p style=\"font-size:15px;line-height:1.5;\">Xin chào <strong>" + greetingName + "</strong>,</p>"
                + "<p style=\"font-size:14px;color:#475569;line-height:1.5;\">Hệ thống Thư viện gửi email thông báo nhắc nhở về tình trạng mượn tài liệu của bạn:</p>"
                + "<div style=\"background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:14px 18px;margin:16px 0;\">"
                + "<p style=\"margin:4px 0;font-size:14px;\">📚 <strong>Tác phẩm:</strong> " + bookTitle + "</p>"
                + "<p style=\"margin:4px 0;font-size:14px;\">📅 <strong>Hạn hoàn trả:</strong> <span style=\"font-weight:700;color:#1e3a5f;\">" + formattedDate + "</span></p>"
                + "</div>"
                + statusAlertHtml
                + "<p style=\"font-size:14px;line-height:1.6;color:#475569;margin-top:16px;\">"
                + "Bạn có thể hoàn trả tài liệu trực tiếp tại quầy phục vụ của Thư viện hoặc truy cập vào trang web để thao tác trả sách."
                + "</p>"
                + "<div style=\"margin:24px 0;text-align:center;\">"
                + "<a href=\"" + frontendUrl + "/my-loans\" style=\"background-color:#1e3a5f;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600;display:inline-block;\">Mở trang Mượn và trả sách</a>"
                + "</div>"
                + "<hr style=\"border:none;border-top:1px solid #e2e8f0;margin:24px 0;\"/>"
                + "<p style=\"font-size:12px;color:#94a3b8;margin:0;text-align:center;\">Email này được gửi tự động từ Hệ thống Quản lý Thư viện. Vui lòng không trả lời trực tiếp email này.</p>"
                + "</div>";

        send(toEmail, subject, htmlContent);
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
