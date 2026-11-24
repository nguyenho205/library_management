package com.fresher.library.repository;

import com.fresher.library.entity.SocialIdentity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SocialIdentityRepository extends JpaRepository<SocialIdentity, Long> {
    Optional<SocialIdentity> findByProviderAndSubject(String provider, String subject);
    boolean existsByAccount_IdAndProvider(Long accountId, String provider);
}
