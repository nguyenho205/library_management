package com.fresher.library.repository;

import com.fresher.library.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findTop50ByRecipient_EmailOrderByCreatedAtDesc(String email);
    List<Notification> findByRecipient_EmailAndReadFalse(String email);
    long countByRecipient_EmailAndReadFalse(String email);
    Optional<Notification> findByIdAndRecipient_Email(Long id, String email);
    boolean existsByEventKey(String eventKey);
    List<Notification> findByEventKeyStartingWith(String prefix);
}
