package com.fresher.library.service;

import java.time.LocalDate;

public interface EmailService {
    void sendVerificationEmail(String toEmail, String code);
    void sendPasswordResetCode(String toEmail, String code);
    void sendChangeEmailCode(String newEmail, String code);
    void sendDueReminderEmail(String toEmail, String memberName, String bookTitle, LocalDate dueDate, long daysRemainingOrOverdue, boolean isOverdue);
}
