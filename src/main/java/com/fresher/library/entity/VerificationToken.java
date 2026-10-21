package com.fresher.library.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * VerificationToken = token dung chung cho 3 muc dich:
 * - EMAIL_VERIFY: xac thuc email khi dang ky
 * - PASSWORD_RESET: quen mat khau
 * - EMAIL_CHANGE: doi email (newEmail luu email moi can xac nhan)
 */
@Entity
@Table(name = "verification_token")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String token;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private TokenType type;

    /** Chi dung cho loai EMAIL_CHANGE: email moi dang cho xac nhan */
    @Column(name = "new_email", length = 150)
    private String newEmail;

    @Column(name = "verification_code", length = 6)
    private String verificationCode;

    @Column(name = "expiry_date", nullable = false)
    private LocalDateTime expiryDate;

    @Builder.Default
    @Column(nullable = false)
    @JdbcTypeCode(SqlTypes.TINYINT)
    private boolean used = false;
}
