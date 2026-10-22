package com.fresher.library.service;

import com.fresher.library.dto.request.BookRequest;
import com.fresher.library.dto.response.BookResponse;
import com.fresher.library.dto.response.PageResponse;
import com.fresher.library.entity.BookStatus;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface BookService {
    PageResponse<BookResponse> search(String title, String isbn, String author, Long categoryId, BookStatus status, int page, int size);
    List<BookResponse> getRecommendations(String email, String tab, int limit);
    BookResponse getById(Long id);
    BookResponse create(BookRequest request);
    BookResponse update(Long id, BookRequest request);
    BookResponse discontinue(Long id);
    BookResponse restore(Long id);
    void delete(Long id);
    int importFromCsv(MultipartFile file);
}
