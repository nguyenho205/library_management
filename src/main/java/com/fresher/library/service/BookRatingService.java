package com.fresher.library.service;

import com.fresher.library.dto.request.BookRatingRequest;
import com.fresher.library.dto.response.BookRatingResponse;
import com.fresher.library.dto.response.BookRatingSummaryResponse;
import com.fresher.library.entity.Book;
import com.fresher.library.entity.BookRating;
import com.fresher.library.entity.BorrowRecord;
import com.fresher.library.entity.BorrowStatus;
import com.fresher.library.exception.BadRequestException;
import com.fresher.library.exception.ResourceNotFoundException;
import com.fresher.library.repository.BookRatingRepository;
import com.fresher.library.repository.BookRepository;
import com.fresher.library.repository.BorrowRecordRepository;
import com.fresher.library.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookRatingService {
    private final BookRatingRepository ratingRepository;
    private final BookRepository bookRepository;
    private final BorrowRecordRepository borrowRecordRepository;
    private final MemberRepository memberRepository;

    @Transactional(readOnly = true)
    public BookRatingSummaryResponse getBookRatings(Long bookId, String email) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách với mã ID=" + bookId));
        var member = memberRepository.findByAccount_Email(email).orElse(null);
        BookRating myRating = member == null ? null : ratingRepository.findByMember_IdAndBook_Id(member.getId(), bookId).orElse(null);
        List<BookRatingResponse> reviews = ratingRepository.findTop30ByBook_IdOrderByUpdatedAtDesc(bookId)
                .stream().map(BookRatingResponse::from).toList();
        return BookRatingSummaryResponse.builder()
                .averageRating(ratingRepository.averageScoreByBookId(book.getId()))
                .ratingCount(ratingRepository.countByBook_Id(book.getId()))
                .myScore(myRating == null ? null : myRating.getScore())
                .myComment(myRating == null ? null : myRating.getComment())
                .reviews(reviews)
                .build();
    }

    @Transactional(readOnly = true)
    public List<BookRatingResponse> getMyRatings(String email) {
        return memberRepository.findByAccount_Email(email)
                .map(member -> ratingRepository.findByMember_IdOrderByUpdatedAtDesc(member.getId()).stream().map(BookRatingResponse::from).toList())
                .orElse(List.of());
    }

    @Transactional
    public BookRatingResponse rateBook(Long bookId, String email, BookRatingRequest request) {
        var member = memberRepository.findByAccount_Email(email)
                .orElseThrow(() -> new BadRequestException("Chỉ bạn đọc đã mượn sách mới có thể gửi đánh giá."));
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách với mã ID=" + bookId));
        BorrowRecord returnedLoan = borrowRecordRepository
                .findByIdAndMember_IdAndBook_IdAndStatus(request.getBorrowRecordId(), member.getId(), bookId, BorrowStatus.RETURNED)
                .orElseThrow(() -> new BadRequestException("Bạn chỉ có thể đánh giá sau khi đã mượn và trả cuốn sách này."));

        BookRating rating = ratingRepository.findByMember_IdAndBook_Id(member.getId(), bookId)
                .orElseGet(() -> BookRating.builder().member(member).book(book).build());
        rating.setBorrowRecord(returnedLoan);
        rating.setScore(request.getScore());
        rating.setComment(request.getComment() == null || request.getComment().isBlank() ? null : request.getComment().trim());
        return BookRatingResponse.from(ratingRepository.save(rating));
    }
}
