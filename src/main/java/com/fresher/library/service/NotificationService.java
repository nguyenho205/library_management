package com.fresher.library.service;

import com.fresher.library.dto.response.NotificationResponse;
import com.fresher.library.entity.Account;
import com.fresher.library.entity.BorrowRecord;
import com.fresher.library.entity.Notification;
import com.fresher.library.entity.Role;
import com.fresher.library.repository.AccountRepository;
import com.fresher.library.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final AccountRepository accountRepository;

    @Transactional(readOnly = true)
    public List<NotificationResponse> list(String email) {
        return notificationRepository.findTop50ByRecipient_EmailOrderByCreatedAtDesc(email)
                .stream().map(NotificationResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(String email) {
        return notificationRepository.countByRecipient_EmailAndReadFalse(email);
    }

    @Transactional
    public void markRead(String email, Long id) {
        notificationRepository.findByIdAndRecipient_Email(id, email).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }

    @Transactional
    public void markAllRead(String email) {
        notificationRepository.findByRecipient_EmailAndReadFalse(email).forEach(notification -> notification.setRead(true));
    }

    @Transactional
    public void borrowRequested(BorrowRecord record) {
        String title = record.getBook().getTitle();
        create(record.getMember().getAccount(), "BORROW_REQUEST", "Yêu cầu mượn đã được gửi",
                "Yêu cầu mượn “" + title + "” đang chờ thủ thư duyệt.", "/my-loans",
                "borrow-request-member:" + record.getId());

        for (Account admin : accountRepository.findByRoleAndEnabledTrue(Role.ADMIN)) {
            create(admin, "BORROW_REQUEST", "Có yêu cầu mượn sách mới",
                    record.getMember().getFullName() + " muốn mượn “" + title + "”.",
                    "/admin/circulation", "borrow-request-admin:" + admin.getId() + ":" + record.getId());
        }
    }

    @Transactional
    public void borrowApproved(BorrowRecord record) {
        createForRecordMember(record, "BORROW_APPROVED", "Yêu cầu mượn đã được duyệt",
                "Bạn có thể nhận sách “" + record.getBook().getTitle() + "”. Hạn trả: " + record.getDueDate() + ".",
                "/my-loans", "borrow-approved:" + record.getId());
    }

    @Transactional
    public void borrowRejected(BorrowRecord record) {
        createForRecordMember(record, "BORROW_REJECTED", "Yêu cầu mượn chưa được duyệt",
                "Yêu cầu mượn “" + record.getBook().getTitle() + "” đã bị từ chối.",
                "/my-loans", "borrow-rejected:" + record.getId());
    }

    @Transactional
    public void borrowCancelled(BorrowRecord record) {
        for (Account admin : accountRepository.findByRoleAndEnabledTrue(Role.ADMIN)) {
            create(admin, "BORROW_CANCELLED", "Độc giả đã hủy yêu cầu mượn",
                    record.getMember().getFullName() + " đã hủy yêu cầu mượn “" + record.getBook().getTitle() + "”.",
                    "/admin/circulation", "borrow-cancelled-admin:" + admin.getId() + ":" + record.getId());
        }
    }

    @Transactional
    public void bookReturned(BorrowRecord record) {
        createForRecordMember(record, "BOOK_RETURNED", "Đã xác nhận trả sách",
                "Thư viện đã xác nhận bạn trả “" + record.getBook().getTitle() + "”.",
                "/my-loans", "book-returned:" + record.getId());
    }

    @Transactional
    public void dueReminder(BorrowRecord record, LocalDate today) {
        LocalDate due = record.getDueDate();
        if (due == null) return;
        boolean overdue = due.isBefore(today);
        long days = Math.abs(ChronoUnit.DAYS.between(today, due));
        String message = overdue
                ? "Sách “" + record.getBook().getTitle() + "” đã quá hạn " + days + " ngày. Vui lòng liên hệ thư viện để trả sách."
                : due.isEqual(today)
                    ? "Sách “" + record.getBook().getTitle() + "” đến hạn trả hôm nay."
                    : "Sách “" + record.getBook().getTitle() + "” sẽ đến hạn trả sau " + days + " ngày (" + due + ").";
        String key = "borrow-due:" + record.getId() + ":" + today;
        create(record.getMember().getAccount(), overdue ? "BOOK_OVERDUE" : "BOOK_DUE",
                overdue ? "Sách đã quá hạn" : "Nhắc hạn trả sách", message, "/my-loans", key);
    }

    private void createForRecordMember(BorrowRecord record, String type, String title, String message,
                                       String targetUrl, String eventKey) {
        create(record.getMember().getAccount(), type, title, message, targetUrl, eventKey);
    }

    private void create(Account recipient, String type, String title, String message, String targetUrl, String eventKey) {
        if (recipient == null || notificationRepository.existsByEventKey(eventKey)) return;
        notificationRepository.save(Notification.builder()
                .recipient(recipient).type(type).title(title).message(message)
                .targetUrl(targetUrl).eventKey(eventKey).build());
    }
}
