package com.fresher.library.service;

import com.fresher.library.config.DataSeeder;
import com.fresher.library.dto.response.JwtResponse;
import com.fresher.library.entity.Account;
import com.fresher.library.entity.Member;
import com.fresher.library.entity.Permission;
import com.fresher.library.entity.Role;
import com.fresher.library.entity.SocialIdentity;
import com.fresher.library.exception.BadRequestException;
import com.fresher.library.exception.UnauthorizedException;
import com.fresher.library.repository.AccountRepository;
import com.fresher.library.repository.MemberRepository;
import com.fresher.library.repository.PermissionGroupRepository;
import com.fresher.library.repository.SocialIdentityRepository;
import com.fresher.library.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SocialAuthService {
    private final SocialTokenVerifier verifier;
    private final SocialIdentityRepository identities;
    private final AccountRepository accounts;
    private final MemberRepository members;
    private final PermissionGroupRepository groups;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public JwtResponse login(String provider, String credential) {
        var identity = verifier.verify(provider, credential);
        Account account = identities.findByProviderAndSubject(identity.provider(), identity.subject())
                .map(SocialIdentity::getAccount).orElse(null);
        if (account == null) {
            account = accounts.findByEmail(identity.email()).orElse(null);
            if (account != null && !("GOOGLE".equals(identity.provider()) && identity.authoritativeEmail())) {
                throw new BadRequestException("Email đã có tài khoản. Hãy đăng nhập bằng mật khẩu, vào Cài đặt để liên kết "
                        + identity.provider() + ".");
            }
            if (account == null) {
                account = accounts.save(Account.builder()
                        .email(identity.email())
                        .password(passwordEncoder.encode(UUID.randomUUID().toString() + UUID.randomUUID()))
                        .role(Role.USER)
                        .enabled(true)
                        .emailVerified(true)
                        .permissionGroup(groups.findByName(DataSeeder.GROUP_BORROW)
                                .orElseThrow(() -> new IllegalStateException("Default permission group is missing")))
                        .build());
                members.save(Member.builder().account(account)
                        .fullName(identity.name() == null || identity.name().isBlank()
                                ? identity.email().split("@")[0] : identity.name()).build());
            }
            if (!account.isEnabled()) throw new UnauthorizedException("Tài khoản đã bị khóa");
            if (identities.existsByAccount_IdAndProvider(account.getId(), identity.provider())) {
                throw new BadRequestException("Tài khoản này đã liên kết một " + identity.provider() + " khác");
            }
            saveIdentity(identity, account);
            if (!account.isEmailVerified()) {
                account.setEmailVerified(true);
                accounts.save(account);
            }
        }
        if (!account.isEnabled()) throw new UnauthorizedException("Tài khoản đã bị khóa");
        return JwtResponse.builder()
                .accessToken(jwtTokenProvider.generateAccessToken(account.getEmail(), account.getRole().name()))
                .refreshToken(jwtTokenProvider.generateRefreshToken(account.getEmail(), account.getRole().name()))
                .tokenType("Bearer")
                .email(account.getEmail())
                .role(account.getRole().name())
                .permissions(account.getPermissionGroup().getPermissions().stream()
                        .map(Permission::getCode).distinct().sorted().toList())
                .build();
    }

    @Transactional
    public void link(String accountEmail, String provider, String credential) {
        var identity = verifier.verify(provider, credential);
        Account account = accounts.findByEmail(accountEmail)
                .orElseThrow(() -> new UnauthorizedException("Tài khoản không tồn tại"));
        if (!account.isEnabled()) throw new UnauthorizedException("Tài khoản đã bị khóa");
        if (identities.findByProviderAndSubject(identity.provider(), identity.subject()).isPresent()) {
            throw new BadRequestException("Tài khoản mạng xã hội này đã được liên kết");
        }
        if (identities.existsByAccount_IdAndProvider(account.getId(), identity.provider())) {
            throw new BadRequestException("Bạn đã liên kết một tài khoản " + identity.provider());
        }
        saveIdentity(identity, account);
    }

    private void saveIdentity(SocialTokenVerifier.Identity identity, Account account) {
        SocialIdentity link = new SocialIdentity();
        link.setProvider(identity.provider());
        link.setSubject(identity.subject());
        link.setAccount(account);
        identities.save(link);
    }
}
