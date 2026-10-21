package com.fresher.library.service;

public interface EmailService {
    void sendVerificationEmail(String toEmail, String code);
    void sendPasswordResetCode(String toEmail, String code);
    void sendChangeEmailCode(String newEmail, String code);
}
