package com.fresher.library.controller;

import com.fresher.library.dto.response.ApiResponse;
import com.fresher.library.dto.response.BookRatingResponse;
import com.fresher.library.service.BookRatingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/book-ratings")
@RequiredArgsConstructor
public class MyBookRatingController {
    private final BookRatingService ratingService;

    @GetMapping("/mine")
    public ResponseEntity<ApiResponse<List<BookRatingResponse>>> getMyRatings(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(ratingService.getMyRatings(authentication.getName())));
    }
}
