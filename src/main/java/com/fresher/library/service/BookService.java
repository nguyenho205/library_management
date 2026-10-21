package com.fresher.library.service;

import com.fresher.library.dto.request.BookRequest;
import com.fresher.library.dto.response.BookResponse;
import com.fresher.library.dto.response.PageResponse;
import org.springframework.web.multipart.MultipartFile;

public interface BookService {
    PageResponse<BookResponse> search(String title, String isbn, String author, Long categoryId, int page, int size);
    BookResponse getById(Long id);
    BookResponse create(BookRequest request);
    BookResponse update(Long id, BookRequest request);
    void delete(Long id);
    int importFromCsv(MultipartFile file);
}
