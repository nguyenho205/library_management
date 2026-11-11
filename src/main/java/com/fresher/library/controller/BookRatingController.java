package com.fresher.library.controller;

import com.fresher.library.dto.request.BookRatingRequest;
import com.fresher.library.dto.response.ApiResponse;
import com.fresher.library.dto.response.BookRatingResponse;
import com.fresher.library.dto.response.BookRatingSummaryResponse;
import com.fresher.library.service.BookRatingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/books/{bookId}/ratings")
@RequiredArgsConstructor
public class BookRatingController {
    private final BookRatingService ratingService;

    @GetMapping
    @PreAuthorize("hasAuthority('BOOK_VIEW')")
    public ResponseEntity<ApiResponse<BookRatingSummaryResponse>> getRatings(@PathVariable Long bookId, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(ratingService.getBookRatings(bookId, authentication.getName())));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('BORROW_USE')")
    public ResponseEntity<ApiResponse<BookRatingResponse>> rate(@PathVariable Long bookId,
                                                                 Authentication authentication,
                                                                 @Valid @RequestBody BookRatingRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Đã lưu đánh giá sách.", ratingService.rateBook(bookId, authentication.getName(), request)));
    }
}
