package com.fresher.library.dto.response;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class BookRatingSummaryResponse {
    double averageRating;
    long ratingCount;
    Integer myScore;
    String myComment;
    List<BookRatingResponse> reviews;
}
