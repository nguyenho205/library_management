package com.fresher.library.service;

import com.fresher.library.dto.request.ChangePasswordRequest;
import com.fresher.library.dto.request.RegisterRequest;
import com.fresher.library.entity.Account;
import com.fresher.library.entity.Role;
import com.fresher.library.exception.BadRequestException;
import com.fresher.library.repository.AccountRepository;
import com.fresher.library.repository.MemberRepository;
import com.fresher.library.repository.PermissionGroupRepository;
import com.fresher.library.repository.VerificationTokenRepository;
import com.fresher.library.security.JwtTokenProvider;
import com.fresher.library.security.TokenBlacklistService;
import com.fresher.library.service.impl.AuthServiceImpl;
import com.fresher.library.service.EmailService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

/**
 * Test cac rule nghiep vu quan trong cua chuc nang Auth:
 * 1. Khong cho dang ky trung email
 * 2. Doi mat khau phai kiem tra dung mat khau cu truoc khi cho doi
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock private AccountRepository accountRepository;
    @Mock private MemberRepository memberRepository;
    @Mock private VerificationTokenRepository tokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private TokenBlacklistService tokenBlacklistService;
    @Mock private EmailService emailService;
    @Mock private PermissionGroupRepository permissionGroupRepository;

    @InjectMocks
    private AuthServiceImpl authService;

    @Test
    void register_emailDaTonTai_phaiNemBadRequestException() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("exists@test.com");
        request.setPassword("Password@123");
        request.setConfirmPassword("Password@123");
        request.setFullName("Nguyen Van A");

        when(accountRepository.existsByEmail("exists@test.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("đã được đăng ký");

        verify(accountRepository, never()).save(any());
        verify(emailService, never()).sendVerificationEmail(any(), any());
    }

    @Test
    void changePassword_saiMatKhauCu_phaiNemBadRequestException() {
        Account account = Account.builder()
                .id(1L).email("user@test.com").password("encoded-old-password").role(Role.USER).build();

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setOldPassword("wrong-password");
        request.setNewPassword("NewPassword@123");

        when(accountRepository.findByEmail("user@test.com")).thenReturn(Optional.of(account));
        when(passwordEncoder.matches("wrong-password", "encoded-old-password")).thenReturn(false);

        assertThatThrownBy(() -> authService.changePassword("user@test.com", request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Mật khẩu hiện tại không đúng");

        verify(accountRepository, never()).save(any());
    }

    @Test
    void changePassword_dungMatKhauCu_phaiDoiThanhCong() {
        Account account = Account.builder()
                .id(1L).email("user@test.com").password("encoded-old-password").role(Role.USER).build();

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setOldPassword("correct-password");
        request.setNewPassword("NewPassword@123");

        when(accountRepository.findByEmail("user@test.com")).thenReturn(Optional.of(account));
        when(passwordEncoder.matches("correct-password", "encoded-old-password")).thenReturn(true);
        when(passwordEncoder.encode("NewPassword@123")).thenReturn("encoded-new-password");

        authService.changePassword("user@test.com", request);

        verify(accountRepository, times(1)).save(account);
        assert account.getPassword().equals("encoded-new-password");
    }
}
