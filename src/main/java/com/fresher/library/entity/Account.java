package com.fresher.library.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * Account = tai khoan dung de dang nhap he thong (email + password + role).
 * Quan he 1-1 voi Member (thong tin ho so chi tiet cua user, Admin co the khong co Member).
 */
@Entity
@Table(name = "account")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @JsonIgnore
    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private Role role;

    @Builder.Default
    @Column(nullable = false)
    @JdbcTypeCode(SqlTypes.TINYINT)
    private boolean enabled = true;

    @Builder.Default
    @Column(name = "email_verified", nullable = false)
    @JdbcTypeCode(SqlTypes.TINYINT)
    private boolean emailVerified = false;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /**
     * Session ID phuc vu co che Single Session: moi lan dang nhap se sinh UUID moi.
     * Neu co dang nhap o noi khac, session_id thay doi -> cac phien cu bi da ra.
     */
    @Column(name = "session_id", length = 64)
    private String sessionId;

    // Quan he 1-1: 1 Account <-> 1 Member profile (chi USER moi co Member)
    @OneToOne(mappedBy = "account", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private Member member;

    // Moi tai khoan chi thuoc mot nhom quyen; mot nhom co the dung cho nhieu tai khoan.
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "permission_group_id", nullable = false)
    @JsonIgnore
    private PermissionGroup permissionGroup;
}
