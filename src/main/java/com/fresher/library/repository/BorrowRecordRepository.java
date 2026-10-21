package com.fresher.library.repository;

import com.fresher.library.entity.BorrowRecord;
import com.fresher.library.entity.BorrowStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BorrowRecordRepository extends JpaRepository<BorrowRecord, Long> {

    List<BorrowRecord> findByMember_IdAndStatus(Long memberId, BorrowStatus status);

    Optional<BorrowRecord> findByMember_IdAndBook_IdAndStatus(Long memberId, Long bookId, BorrowStatus status);

    boolean existsByMember_IdAndStatus(Long memberId, BorrowStatus status);
}
