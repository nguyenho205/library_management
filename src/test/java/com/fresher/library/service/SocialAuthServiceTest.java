package com.fresher.library.service;

import com.fresher.library.entity.Account;
import com.fresher.library.entity.PermissionGroup;
import com.fresher.library.entity.Role;
import com.fresher.library.entity.SocialIdentity;
import com.fresher.library.exception.BadRequestException;
import com.fresher.library.exception.UnauthorizedException;
import com.fresher.library.repository.AccountRepository;
import com.fresher.library.repository.MemberRepository;
import com.fresher.library.repository.PermissionGroupRepository;
import com.fresher.library.repository.SocialIdentityRepository;
import com.fresher.library.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SocialAuthServiceTest {
    @Mock SocialTokenVerifier verifier;
    @Mock SocialIdentityRepository identities;
    @Mock AccountRepository accounts;
    @Mock MemberRepository members;
    @Mock PermissionGroupRepository groups;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtTokenProvider jwtTokenProvider;
    @InjectMocks SocialAuthService service;

    @Test
    void facebookCannotTakeOverExistingEmailWithoutLinking() {
        var identity = new SocialTokenVerifier.Identity("FACEBOOK", "fb-123", "reader@example.com", "Reader", false);
        when(verifier.verify("facebook", "token")).thenReturn(identity);
        when(identities.findByProviderAndSubject("FACEBOOK", "fb-123")).thenReturn(Optional.empty());
        when(accounts.findByEmail("reader@example.com")).thenReturn(Optional.of(Account.builder().id(1L).build()));

        assertThatThrownBy(() -> service.login("facebook", "token"))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("liên kết");
        verify(identities, never()).save(any());
    }

    @Test
    void linkedLockedAccountCannotLogin() {
        var identity = new SocialTokenVerifier.Identity("GOOGLE", "google-123", "reader@gmail.com", "Reader", true);
        var account = Account.builder().id(1L).enabled(false).build();
        var link = new SocialIdentity();
        link.setAccount(account);
        when(verifier.verify("google", "token")).thenReturn(identity);
        when(identities.findByProviderAndSubject("GOOGLE", "google-123")).thenReturn(Optional.of(link));

        assertThatThrownBy(() -> service.login("google", "token"))
                .isInstanceOf(UnauthorizedException.class).hasMessageContaining("khóa");
        verify(jwtTokenProvider, never()).generateAccessToken(any(), any());
    }

    @Test
    void verifiedGoogleEmailCanLinkExistingReader() {
        var identity = new SocialTokenVerifier.Identity("GOOGLE", "google-123", "reader@gmail.com", "Reader", true);
        var group = PermissionGroup.builder().permissions(new HashSet<>()).build();
        var account = Account.builder().id(1L).email("reader@gmail.com").role(Role.USER)
                .enabled(true).emailVerified(true).permissionGroup(group).build();
        when(verifier.verify("google", "token")).thenReturn(identity);
        when(identities.findByProviderAndSubject("GOOGLE", "google-123")).thenReturn(Optional.empty());
        when(accounts.findByEmail("reader@gmail.com")).thenReturn(Optional.of(account));
        when(jwtTokenProvider.generateAccessToken("reader@gmail.com", "USER")).thenReturn("access");
        when(jwtTokenProvider.generateRefreshToken("reader@gmail.com", "USER")).thenReturn("refresh");

        var result = service.login("google", "token");

        assertThat(result.getAccessToken()).isEqualTo("access");
        verify(identities).save(any(SocialIdentity.class));
    }
}
