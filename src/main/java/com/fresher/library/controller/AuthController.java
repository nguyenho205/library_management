package com.fresher.library.controller;

import com.fresher.library.dto.request.*;
import com.fresher.library.dto.response.ApiResponse;
import com.fresher.library.dto.response.JwtResponse;
import com.fresher.library.service.AuthService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Chuc nang: XAC THUC (Authentication)
 * - Dang ky tai khoan moi + xac thuc email (verify)
 * - Dang nhap / Dang xuat (JWT, logout chan token qua blacklist)
 * - Refresh token: refresh con han thi tu dong cap token moi, het han/invalid thi 401
 * - Quen mat khau / Dat lai mat khau / Doi mat khau / Doi email (co xac nhan qua email)
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Dang ky, dang nhap, dang xuat, quan ly mat khau/email")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok(ApiResponse.success(
                "Đăng ký thành công. Vui lòng kiểm tra email và nhập mã xác thực.", null));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<Void>> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        authService.verifyEmail(request.getEmail(), request.getCode());
        return ResponseEntity.ok(ApiResponse.success("Xác thực email thành công. Bạn có thể đăng nhập ngay.", null));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<ApiResponse<Void>> resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        authService.resendVerification(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success(
                "Nếu email tồn tại và chưa xác thực, mã mới sẽ được gửi đến hộp thư của bạn.", null));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<JwtResponse>> login(@Valid @RequestBody LoginRequest request) {
        JwtResponse jwt = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", jwt));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
        authService.logout(token);
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công", null));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<JwtResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        JwtResponse jwt = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success("Cấp token mới thành công", jwt));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(Authentication authentication,
                                                              @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công", null));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Nếu email tồn tại, mã đặt lại mật khẩu đã được gửi.", null));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Đặt lại mật khẩu thành công", null));
    }

    @PostMapping("/change-email")
    public ResponseEntity<ApiResponse<Void>> requestChangeEmail(Authentication authentication,
                                                                  @Valid @RequestBody ChangeEmailRequest request) {
        authService.requestChangeEmail(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Mã xác nhận đã được gửi đến email mới.", null));
    }

    @PostMapping("/confirm-email-change")
    public ResponseEntity<ApiResponse<Void>> confirmChangeEmail(
            @Valid @RequestBody ConfirmChangeEmailRequest request) {
        authService.confirmChangeEmail(request.getNewEmail(), request.getCode());
        return ResponseEntity.ok(ApiResponse.success("Đổi email thành công.", null));
    }
}
