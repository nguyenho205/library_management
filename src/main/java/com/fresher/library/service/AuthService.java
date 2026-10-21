package com.fresher.library.service;

import com.fresher.library.dto.request.*;
import com.fresher.library.dto.response.JwtResponse;

public interface AuthService {
    void register(RegisterRequest request);
    void verifyEmail(String email, String code);
    void resendVerification(String email);
    JwtResponse login(LoginRequest request);
    void logout(String accessToken);
    JwtResponse refreshToken(RefreshTokenRequest request);
    void changePassword(String email, ChangePasswordRequest request);
    void forgotPassword(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
    void requestChangeEmail(String email, ChangeEmailRequest request);
    void confirmChangeEmail(String newEmail, String code);
}
