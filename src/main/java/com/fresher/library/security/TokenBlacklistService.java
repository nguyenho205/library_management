package com.fresher.library.security;

import com.fresher.library.entity.BlacklistedToken;
import com.fresher.library.repository.BlacklistedTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Quan ly danh sach token da bi logout (blacklist), dap ung yeu cau:
 * "Logout: khi logout phai chan khong cho su dung token da logout".
 */
@Service
@RequiredArgsConstructor
public class TokenBlacklistService {

    private final BlacklistedTokenRepository blacklistedTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;

    public void blacklist(String token) {
        if (blacklistedTokenRepository.existsByToken(token)) {
            return;
        }
        LocalDateTime expiry = jwtTokenProvider.getExpiration(token)
                .toInstant()
                .atZone(java.time.ZoneId.systemDefault())
                .toLocalDateTime();
        blacklistedTokenRepository.save(BlacklistedToken.builder()
                .token(token)
                .expiryDate(expiry)
                .build());
    }

    public boolean isBlacklisted(String token) {
        return blacklistedTokenRepository.existsByToken(token);
    }

    /** Don dep cac token da het han khoi bang blacklist moi dem (tranh phinh DB). */
    @Scheduled(cron = "0 0 2 * * *")
    public void purgeExpiredTokens() {
        blacklistedTokenRepository.deleteByExpiryDateBefore(LocalDateTime.now());
    }
}
