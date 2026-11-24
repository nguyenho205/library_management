package com.fresher.library.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "social_identity", uniqueConstraints = {
        @UniqueConstraint(name = "uk_social_provider_subject", columnNames = {"provider", "subject"}),
        @UniqueConstraint(name = "uk_social_account_provider", columnNames = {"account_id", "provider"})
})
@Getter
@Setter
public class SocialIdentity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String provider;

    @Column(nullable = false, length = 255)
    private String subject;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;
}
