package com.fresher.library.service.impl;

import com.fresher.library.config.DataSeeder;
import com.fresher.library.dto.request.*;
import com.fresher.library.dto.response.JwtResponse;
import com.fresher.library.entity.*;
import com.fresher.library.exception.BadRequestException;
import com.fresher.library.exception.ResourceNotFoundException;
import com.fresher.library.exception.UnauthorizedException;
import com.fresher.library.repository.AccountRepository;
import com.fresher.library.repository.MemberRepository;
import com.fresher.library.repository.PermissionGroupRepository;
import com.fresher.library.repository.VerificationTokenRepository;
import com.fresher.library.security.JwtTokenProvider;
import com.fresher.library.security.TokenBlacklistService;
import com.fresher.library.service.AuthService;
import com.fresher.library.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.security.SecureRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
public class AuthServiceImpl implements AuthService {

    private static final long EMAIL_CODE_EXPIRY_MINUTES = 10;
    private static final long ACTION_CODE_EXPIRY_MINUTES = 10;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final AccountRepository accountRepository;
    private final MemberRepository memberRepository;
    private final VerificationTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final TokenBlacklistService tokenBlacklistService;
    private final EmailService emailService;
    private final PermissionGroupRepository permissionGroupRepository;

    @Override
    @Transactional
    public void register(RegisterRequest request) {
        if (!java.util.Objects.equals(request.getPassword(), request.getConfirmPassword())) {
            throw new BadRequestException("Mật khẩu xác nhận không khớp.");
        }
        Account account = accountRepository.findByEmail(request.getEmail()).orElse(null);
        if (account != null) {
            if (account.isEmailVerified() || account.getRole() != Role.USER) {
                throw new BadRequestException("Email này đã được đăng ký.");
            }

            // Cho phép bắt đầu lại nếu lần đăng ký trước chưa được xác thực.
            account.setPassword(passwordEncoder.encode(request.getPassword()));
            account.setEnabled(true);
            account = accountRepository.save(account);

            Member pendingMember = memberRepository.findByAccount_Id(account.getId()).orElse(null);
            if (pendingMember == null) {
                pendingMember = Member.builder().account(account).build();
            }
            pendingMember.setFullName(request.getFullName());
            memberRepository.save(pendingMember);
        } else {
            account = Account.builder()
                    .email(request.getEmail())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .role(Role.USER)
                    .enabled(true)
                    .emailVerified(false)
                    .permissionGroup(defaultGroup())
                    .build();
            account = accountRepository.save(account);

            Member member = Member.builder()
                    .fullName(request.getFullName())
                    .account(account)
                    .build();
            memberRepository.save(member);
        }

        List<VerificationToken> oldCodes = tokenRepository
                .findByAccount_EmailAndTypeAndUsedFalse(account.getEmail(), TokenType.EMAIL_VERIFY);
        oldCodes.forEach(oldCode -> oldCode.setUsed(true));
        tokenRepository.saveAll(oldCodes);

        String code = generateVerificationCode();
        tokenRepository.save(VerificationToken.builder()
                .token(generateToken())
                .account(account)
                .type(TokenType.EMAIL_VERIFY)
                .verificationCode(code)
                .expiryDate(LocalDateTime.now().plusMinutes(EMAIL_CODE_EXPIRY_MINUTES))
                .build());

        emailService.sendVerificationEmail(account.getEmail(), code);
        log.info("Đăng ký thành công cho email={}, chờ xác thực email", account.getEmail());
    }

    @Override
    @Transactional
    public void verifyEmail(String email, String code) {
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Email hoặc mã xác thực không đúng."));
        VerificationToken vt = tokenRepository.findByAccount_EmailAndTypeAndUsedFalse(email, TokenType.EMAIL_VERIFY)
                .stream()
                .filter(candidate -> code.equals(candidate.getVerificationCode()))
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Email hoặc mã xác thực không đúng."));
        if (vt.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Mã xác thực đã hết hạn. Vui lòng yêu cầu gửi mã mới.");
        }
        if (account.isEmailVerified()) {
            throw new BadRequestException("Email này đã được xác thực.");
        }
        account.setEmailVerified(true);
        accountRepository.save(account);
        vt.setUsed(true);
        tokenRepository.save(vt);
        log.info("Xác thực email thành công cho account id={}", account.getId());
    }

    @Override
    @Transactional
    public void resendVerification(String email) {
        accountRepository.findByEmail(email)
                .filter(account -> !account.isEmailVerified())
                .ifPresent(account -> {
                    List<VerificationToken> oldTokens = tokenRepository
                            .findByAccount_EmailAndTypeAndUsedFalse(email, TokenType.EMAIL_VERIFY);
                    oldTokens.forEach(oldToken -> oldToken.setUsed(true));
                    tokenRepository.saveAll(oldTokens);

                    String code = generateVerificationCode();
                    tokenRepository.save(VerificationToken.builder()
                            .token(generateToken())
                            .account(account)
                            .type(TokenType.EMAIL_VERIFY)
                            .verificationCode(code)
                            .expiryDate(LocalDateTime.now().plusMinutes(EMAIL_CODE_EXPIRY_MINUTES))
                            .build());
                    emailService.sendVerificationEmail(account.getEmail(), code);
                });
    }

    @Override
    public JwtResponse login(LoginRequest request) {
        Account account = accountRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Email hoặc mật khẩu không đúng"));

        if (!account.isEmailVerified()) {
            throw new UnauthorizedException("Tài khoản chưa xác thực eamil, vui lòng kiểm tra để xác thực");
        }
        if (!account.isEnabled()) {
            throw new UnauthorizedException("Tài khoản đã bị khóa");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        String accessToken = jwtTokenProvider.generateAccessToken(account.getEmail(), account.getRole().name());
        String refreshToken = jwtTokenProvider.generateRefreshToken(account.getEmail(), account.getRole().name());

        return JwtResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .email(account.getEmail())
                .role(account.getRole().name())
                .permissions(permissionCodes(account))
                .build();
    }

    @Override
    public void logout(String accessToken) {
        tokenBlacklistService.blacklist(accessToken);
        log.info("Da logout va vo hieu hoa access token");
    }

    @Override
    public JwtResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();

        if (!jwtTokenProvider.validateToken(refreshToken)) {
            // Refresh token het han/invalid -> bat buoc phai login lai (tra 401)
            throw new UnauthorizedException("Refresh token không hợp lệ hoặc hết hạn, vui lòng đăng nhập lại");
        }
        if (!"REFRESH".equals(jwtTokenProvider.getTokenKind(refreshToken))) {
            throw new UnauthorizedException("Token không phải là refresh token");
        }

        String email = jwtTokenProvider.getEmailFromToken(refreshToken);
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Tài khoản không tồn tại"));

        // Refresh token con han -> tu dong cap access token MOI (khong bat user login lai)
        String newAccessToken = jwtTokenProvider.generateAccessToken(account.getEmail(), account.getRole().name());
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(account.getEmail(), account.getRole().name());

        return JwtResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .email(account.getEmail())
                .role(account.getRole().name())
                .permissions(permissionCodes(account))
                .build();
    }

    @Override
    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        Account account = getAccountOrThrow(email);
        if (!passwordEncoder.matches(request.getOldPassword(), account.getPassword())) {
            throw new BadRequestException("Mat khau cu khong dung");
        }
        account.setPassword(passwordEncoder.encode(request.getNewPassword()));
        accountRepository.save(account);
        log.info("Doi mat khau thanh cong cho email={}", email);
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        Account account = accountRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay tai khoan voi email nay"));

        List<VerificationToken> oldCodes = tokenRepository
                .findByAccount_EmailAndTypeAndUsedFalse(account.getEmail(), TokenType.PASSWORD_RESET);
        oldCodes.forEach(oldCode -> oldCode.setUsed(true));
        tokenRepository.saveAll(oldCodes);

        String code = generateVerificationCode();
        tokenRepository.save(VerificationToken.builder()
                .token(generateToken())
                .account(account)
                .type(TokenType.PASSWORD_RESET)
                .verificationCode(code)
                .expiryDate(LocalDateTime.now().plusMinutes(ACTION_CODE_EXPIRY_MINUTES))
                .build());

        emailService.sendPasswordResetCode(account.getEmail(), code);
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        VerificationToken vt = tokenRepository
                .findByAccount_EmailAndTypeAndUsedFalse(request.getEmail(), TokenType.PASSWORD_RESET)
                .stream()
                .filter(candidate -> request.getCode().equals(candidate.getVerificationCode()))
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Email hoặc mã xác thực không đúng."));
        validateCode(vt);
        Account account = vt.getAccount();
        account.setPassword(passwordEncoder.encode(request.getNewPassword()));
        accountRepository.save(account);
        vt.setUsed(true);
        tokenRepository.save(vt);
        log.info("Dat lai mat khau thanh cong cho account id={}", account.getId());
    }

    @Override
    @Transactional
    public void requestChangeEmail(String email, ChangeEmailRequest request) {
        if (accountRepository.existsByEmail(request.getNewEmail())) {
            throw new BadRequestException("Email moi da duoc su dung boi tai khoan khac");
        }
        Account account = getAccountOrThrow(email);

        List<VerificationToken> oldCodes = tokenRepository
                .findByAccount_EmailAndTypeAndUsedFalse(account.getEmail(), TokenType.EMAIL_CHANGE);
        oldCodes.forEach(oldCode -> oldCode.setUsed(true));
        tokenRepository.saveAll(oldCodes);

        String code = generateVerificationCode();
        tokenRepository.save(VerificationToken.builder()
                .token(generateToken())
                .account(account)
                .type(TokenType.EMAIL_CHANGE)
                .newEmail(request.getNewEmail())
                .verificationCode(code)
                .expiryDate(LocalDateTime.now().plusMinutes(ACTION_CODE_EXPIRY_MINUTES))
                .build());

        emailService.sendChangeEmailCode(request.getNewEmail(), code);
    }

    @Override
    @Transactional
    public void confirmChangeEmail(String newEmail, String code) {
        VerificationToken vt = tokenRepository
                .findByNewEmailAndTypeAndUsedFalse(newEmail, TokenType.EMAIL_CHANGE)
                .stream()
                .filter(candidate -> code.equals(candidate.getVerificationCode()))
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Email mới hoặc mã xác thực không đúng."));
        validateCode(vt);
        Account account = vt.getAccount();
        account.setEmail(vt.getNewEmail());
        accountRepository.save(account);
        vt.setUsed(true);
        tokenRepository.save(vt);
        log.info("Doi email thanh cong cho account id={}, email moi={}", account.getId(), account.getEmail());
    }

    // ---------- helper ----------

    private void validateCode(VerificationToken token) {
        if (token.isUsed()) {
            throw new BadRequestException("Mã xác thực này đã được sử dụng.");
        }
        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.");
        }
    }

    private Account getAccountOrThrow(String email) {
        return accountRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay tai khoan"));
    }

    private String generateToken() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    private String generateVerificationCode() {
        return String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
    }

    private List<String> permissionCodes(Account account) {
        return account.getPermissionGroup().getPermissions().stream()
                .map(Permission::getCode)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    /** Tai khoan moi dang ky mac dinh duoc gan nhom "Muon tra sach" */
    private PermissionGroup defaultGroup() {
        return permissionGroupRepository.findByName(DataSeeder.GROUP_BORROW)
                .orElseThrow(() -> new IllegalStateException("Default permission group is missing"));
    }
}
