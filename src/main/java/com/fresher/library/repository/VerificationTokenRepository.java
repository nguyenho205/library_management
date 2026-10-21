package com.fresher.library.repository;

import com.fresher.library.entity.VerificationToken;
import com.fresher.library.entity.TokenType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {
    Optional<VerificationToken> findByToken(String token);
    List<VerificationToken> findByAccount_EmailAndTypeAndUsedFalse(String email, TokenType type);
    List<VerificationToken> findByNewEmailAndTypeAndUsedFalse(String newEmail, TokenType type);
}
