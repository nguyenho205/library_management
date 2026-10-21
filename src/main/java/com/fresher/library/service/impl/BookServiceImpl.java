package com.fresher.library.service.impl;

import com.fresher.library.dto.request.BookRequest;
import com.fresher.library.dto.response.BookResponse;
import com.fresher.library.dto.response.PageResponse;
import com.fresher.library.entity.Author;
import com.fresher.library.entity.Book;
import com.fresher.library.entity.Category;
import com.fresher.library.exception.BadRequestException;
import com.fresher.library.exception.ResourceNotFoundException;
import com.fresher.library.repository.AuthorRepository;
import com.fresher.library.repository.BookRepository;
import com.fresher.library.repository.CategoryRepository;
import com.fresher.library.repository.specification.BookSpecification;
import com.fresher.library.service.BookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
public class BookServiceImpl implements BookService {

    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024; // 5MB theo yeu cau de bai
    private static final int MAX_PAGE_SIZE = 10; // yeu cau: toi da 10 record/trang

    private final BookRepository bookRepository;
    private final CategoryRepository categoryRepository;
    private final AuthorRepository authorRepository;

    @Override
    public PageResponse<BookResponse> search(String title, String isbn, String author, Long categoryId, int page, int size) {
        int safeSize = Math.min(size <= 0 ? MAX_PAGE_SIZE : size, MAX_PAGE_SIZE);
        PageRequest pageRequest = PageRequest.of(Math.max(page, 0), safeSize, Sort.by("id").descending());

        Page<Book> result = bookRepository.findAll(
                BookSpecification.withFilters(title, isbn, author, categoryId), pageRequest);

        return PageResponse.from(result.map(this::toResponse));
    }

    @Override
    public BookResponse getById(Long id) {
        return toResponse(findBookOrThrow(id));
    }

    @Override
    @Transactional
    public BookResponse create(BookRequest request) {
        if (bookRepository.existsByIsbn(request.getIsbn())) {
            throw new BadRequestException("ISBN nay da ton tai trong he thong");
        }
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay the loai sach"));

        Book book = Book.builder()
                .isbn(request.getIsbn())
                .title(request.getTitle())
                .description(request.getDescription())
                .quantityTotal(request.getQuantityTotal())
                .quantityAvailable(request.getQuantityTotal())
                .category(category)
                .authors(resolveAuthors(request.getAuthorNames()))
                .build();

        book = bookRepository.save(book);
        log.info("Them sach moi: id={}, isbn={}, title={}", book.getId(), book.getIsbn(), book.getTitle());
        return toResponse(book);
    }

    @Override
    @Transactional
    public BookResponse update(Long id, BookRequest request) {
        Book book = findBookOrThrow(id);

        if (!book.getIsbn().equals(request.getIsbn()) && bookRepository.existsByIsbn(request.getIsbn())) {
            throw new BadRequestException("ISBN nay da ton tai trong he thong");
        }
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay the loai sach"));

        int borrowed = book.getQuantityTotal() - book.getQuantityAvailable();
        if (request.getQuantityTotal() < borrowed) {
            throw new BadRequestException("So luong moi (" + request.getQuantityTotal()
                    + ") khong duoc nho hon so luong dang duoc muon (" + borrowed + ")");
        }

        book.setIsbn(request.getIsbn());
        book.setTitle(request.getTitle());
        book.setDescription(request.getDescription());
        book.setQuantityAvailable(request.getQuantityTotal() - borrowed);
        book.setQuantityTotal(request.getQuantityTotal());
        book.setCategory(category);
        book.setAuthors(resolveAuthors(request.getAuthorNames()));

        book = bookRepository.save(book);
        log.info("Cap nhat sach: id={}", book.getId());
        return toResponse(book);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Book book = findBookOrThrow(id);
        if (book.getQuantityAvailable() < book.getQuantityTotal()) {
            throw new BadRequestException("Khong the xoa sach dang co nguoi muon");
        }
        bookRepository.delete(book);
        log.info("Xoa sach: id={}", id);
    }

    @Override
    @Transactional
    public int importFromCsv(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File rong hoac khong ton tai");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException("File vuot qua dung luong cho phep (toi da 5MB)");
        }
        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".csv")) {
            throw new BadRequestException("Chi ho tro file dinh dang .csv");
        }

        int importedCount = 0;
        try (var reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8)) {
            CSVParser parser = CSVFormat.DEFAULT.withFirstRecordAsHeader().withTrim().parse(reader);
            for (CSVRecord record : parser) {
                importedCount += importOneRow(record);
            }
        } catch (IOException e) {
            throw new BadRequestException("Khong doc duoc noi dung file CSV: " + e.getMessage());
        }
        log.info("Import CSV hoan tat: {} sach moi duoc them", importedCount);
        return importedCount;
    }

    private int importOneRow(CSVRecord record) {
        String isbn = record.get("isbn");
        if (bookRepository.existsByIsbn(isbn)) {
            log.warn("Bo qua dong CSV vi ISBN da ton tai: {}", isbn);
            return 0;
        }
        String categoryName = record.get("category");
        Category category = categoryRepository.findByNameIgnoreCase(categoryName)
                .orElseGet(() -> categoryRepository.save(Category.builder().name(categoryName).build()));

        List<String> authorNames = record.isMapped("authors") && !record.get("authors").isBlank()
                ? List.of(record.get("authors").split(";"))
                : List.of();

        int quantity = Integer.parseInt(record.get("quantityTotal").trim());

        Book book = Book.builder()
                .isbn(isbn)
                .title(record.get("title"))
                .description(record.isMapped("description") ? record.get("description") : null)
                .quantityTotal(quantity)
                .quantityAvailable(quantity)
                .category(category)
                .authors(resolveAuthors(authorNames))
                .build();
        bookRepository.save(book);
        return 1;
    }

    private Set<Author> resolveAuthors(List<String> authorNames) {
        if (authorNames == null) return new HashSet<>();
        Set<Author> authors = new HashSet<>();
        for (String name : authorNames) {
            if (name == null || name.isBlank()) continue;
            String trimmed = name.trim();
            Author author = authorRepository.findByNameIgnoreCase(trimmed)
                    .orElseGet(() -> authorRepository.save(Author.builder().name(trimmed).build()));
            authors.add(author);
        }
        return authors;
    }

    private Book findBookOrThrow(Long id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay sach voi id=" + id));
    }

    private BookResponse toResponse(Book book) {
        return BookResponse.builder()
                .id(book.getId())
                .isbn(book.getIsbn())
                .title(book.getTitle())
                .description(book.getDescription())
                .quantityTotal(book.getQuantityTotal())
                .quantityAvailable(book.getQuantityAvailable())
                .categoryId(book.getCategory() != null ? book.getCategory().getId() : null)
                .categoryName(book.getCategory() != null ? book.getCategory().getName() : null)
                .authorNames(book.getAuthors() == null ? new ArrayList<>() :
                        book.getAuthors().stream().map(Author::getName).collect(Collectors.toList()))
                .createdAt(book.getCreatedAt())
                .build();
    }
}
