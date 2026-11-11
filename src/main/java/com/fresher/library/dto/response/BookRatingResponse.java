package com.fresher.library.dto.response;

import com.fresher.library.entity.BookRating;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class BookRatingResponse {
    Long id;
    Long bookId;
    String bookTitle;
    String reviewerName;
    Integer score;
    String comment;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    public static BookRatingResponse from(BookRating rating) {
        return BookRatingResponse.builder()
                .id(rating.getId())
                .bookId(rating.getBook().getId())
                .bookTitle(rating.getBook().getTitle())
                .reviewerName(rating.getMember().getFullName())
                .score(rating.getScore())
                .comment(rating.getComment())
                .createdAt(rating.getCreatedAt())
                .updatedAt(rating.getUpdatedAt())
                .build();
    }
}
