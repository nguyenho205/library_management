package com.fresher.library.repository;

import com.fresher.library.entity.BookRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BookRatingRepository extends JpaRepository<BookRating, Long> {
    Optional<BookRating> findByMember_IdAndBook_Id(Long memberId, Long bookId);
    List<BookRating> findTop30ByBook_IdOrderByUpdatedAtDesc(Long bookId);
    List<BookRating> findByMember_IdOrderByUpdatedAtDesc(Long memberId);
    long countByBook_Id(Long bookId);

    @Query("SELECT COALESCE(AVG(r.score), 0) FROM BookRating r WHERE r.book.id = :bookId")
    double averageScoreByBookId(@Param("bookId") Long bookId);
}
