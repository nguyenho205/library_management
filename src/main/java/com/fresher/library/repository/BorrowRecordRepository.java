package com.fresher.library.repository;

import com.fresher.library.entity.BorrowRecord;
import com.fresher.library.entity.BorrowStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface BorrowRecordRepository extends JpaRepository<BorrowRecord, Long> {

    List<BorrowRecord> findByMember_IdAndStatus(Long memberId, BorrowStatus status);

    @org.springframework.data.jpa.repository.Query(
        "SELECT r FROM BorrowRecord r " +
        "LEFT JOIN FETCH r.book b " +
        "LEFT JOIN FETCH r.member m " +
        "LEFT JOIN FETCH m.account a " +
        "WHERE r.status = :status ORDER BY r.id DESC")
    List<BorrowRecord> findByStatusWithDetails(@org.springframework.data.repository.query.Param("status") BorrowStatus status);

    @org.springframework.data.jpa.repository.Query(
        "SELECT r FROM BorrowRecord r " +
        "LEFT JOIN FETCH r.book b " +
        "LEFT JOIN FETCH r.member m " +
        "LEFT JOIN FETCH m.account a " +
        "ORDER BY r.id DESC")
    List<BorrowRecord> findAllWithDetails();

    @org.springframework.data.jpa.repository.Query(
        "SELECT r FROM BorrowRecord r " +
        "LEFT JOIN FETCH r.book b " +
        "LEFT JOIN FETCH r.member m " +
        "LEFT JOIN FETCH m.account a " +
        "WHERE m.id = :memberId ORDER BY r.id DESC")
    List<BorrowRecord> findByMemberIdWithDetails(@org.springframework.data.repository.query.Param("memberId") Long memberId);

    Optional<BorrowRecord> findByMember_IdAndBook_IdAndStatus(Long memberId, Long bookId, BorrowStatus status);

    boolean existsByMember_IdAndStatus(Long memberId, BorrowStatus status);

    boolean existsByMember_IdAndStatusIn(Long memberId, Collection<BorrowStatus> statuses);

    long countByMember_IdAndStatusIn(Long memberId, Collection<BorrowStatus> statuses);

    boolean existsByMember_IdAndBook_IdAndStatusIn(Long memberId, Long bookId, Collection<BorrowStatus> statuses);

    boolean existsByBook_Id(Long bookId);

    boolean existsByBook_IdAndStatus(Long bookId, BorrowStatus status);
}
