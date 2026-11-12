package com.fresher.library.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "notification", uniqueConstraints = @UniqueConstraint(name = "uk_notification_event_key", columnNames = "event_key"))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_account_id", nullable = false)
    private Account recipient;

    @Column(nullable = false, length = 40)
    private String type;

    @Column(nullable = false, length = 180)
    private String title;

    @Column(nullable = false, length = 700)
    private String message;

    @Column(name = "target_url", length = 300)
    private String targetUrl;

    @Column(name = "event_key", nullable = false, unique = true, length = 160)
    private String eventKey;

    @Builder.Default
    @Column(name = "is_read", nullable = false)
    @JdbcTypeCode(SqlTypes.TINYINT)
    private boolean read = false;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
