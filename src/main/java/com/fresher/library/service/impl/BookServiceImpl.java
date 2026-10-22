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
import com.fresher.library.repository.BorrowRecordRepository;
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
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import com.fresher.library.entity.BookStatus;
import com.fresher.library.entity.BorrowRecord;
import com.fresher.library.entity.BorrowStatus;
import com.fresher.library.entity.Member;
import com.fresher.library.repository.MemberRepository;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Log4j2
public class BookServiceImpl implements BookService {

    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024; // 5MB theo yeu cau de bai
    private static final int MAX_PAGE_SIZE = 10; // yeu cau: toi da 10 record/trang

    private final BookRepository bookRepository;
    private final CategoryRepository categoryRepository;
    private final AuthorRepository authorRepository;
    private final BorrowRecordRepository borrowRecordRepository;
    private final MemberRepository memberRepository;

    @Override
    public PageResponse<BookResponse> search(String title, String isbn, String author, Long categoryId, BookStatus status, int page, int size) {
        int safeSize = Math.min(size <= 0 ? MAX_PAGE_SIZE : size, MAX_PAGE_SIZE);
        PageRequest pageRequest = PageRequest.of(Math.max(page, 0), safeSize, Sort.by("id").descending());

        Page<Book> result = bookRepository.findAll(
                BookSpecification.withFilters(title, isbn, author, categoryId, status), pageRequest);

        return PageResponse.from(result.map(this::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookResponse> getRecommendations(String email, String tab, int limit) {
        int safeLimit = limit <= 0 ? 4 : Math.min(limit, 10);
        String activeTab = tab != null ? tab.toUpperCase() : "CATEGORY";

        // 1. Thu thap lich su muon sach cua member de phan tich so thich
        List<BorrowRecord> history = new ArrayList<>();
        if (StringUtils.hasText(email)) {
            memberRepository.findByAccount_Email(email)
                    .ifPresent(m -> {
                        if (m.getBorrowRecords() != null) {
                            history.addAll(m.getBorrowRecords());
                        }
                    });
        }

        // Sap xep lich su theo ngay muon moi nhat len dau
        history.sort((a, b) -> {
            if (a.getBorrowDate() == null || b.getBorrowDate() == null) return 0;
            return b.getBorrowDate().compareTo(a.getBorrowDate());
        });

        // 2. Tinh trong so the loai va tac gia tu lich su doc
        Set<Long> currentlyBorrowedBookIds = new HashSet<>();
        Set<Long> allBorrowedBookIds = new HashSet<>();
        Map<Long, Integer> categoryScores = new HashMap<>();
        Map<Long, Integer> authorScores = new HashMap<>();

        for (int i = 0; i < history.size(); i++) {
            BorrowRecord record = history.get(i);
            Book b = record.getBook();
            if (b == null) continue;

            allBorrowedBookIds.add(b.getId());
            if (record.getStatus() == BorrowStatus.BORROWED) {
                currentlyBorrowedBookIds.add(b.getId());
            }

            int recencyWeight = (i < 5) ? 3 : 1;

            if (b.getCategory() != null) {
                categoryScores.merge(b.getCategory().getId(), recencyWeight * 10, Integer::sum);
            }

            if (b.getAuthors() != null) {
                for (Author a : b.getAuthors()) {
                    authorScores.merge(a.getId(), recencyWeight * 8, Integer::sum);
                }
            }
        }

        // Dem tong luot muon toan he thong
        Map<Long, Long> globalBorrowCounts = borrowRecordRepository.findAll().stream()
                .filter(r -> r.getBook() != null)
                .collect(Collectors.groupingBy(r -> r.getBook().getId(), Collectors.counting()));

        // 3. Loc danh sach ung vien: BAT BUOC dang phat hanh (IN_CIRCULATION), khong lay sach DISCONTINUED
        List<Book> candidates = bookRepository.findAll().stream()
                .filter(b -> b.getStatus() == null || b.getStatus() == BookStatus.IN_CIRCULATION)
                .filter(b -> !currentlyBorrowedBookIds.contains(b.getId()))
                .collect(Collectors.toList());

        // 4. Cham diem phu hop theo tung Tab
        class ScoredBook {
            final Book book;
            final double score;

            ScoredBook(Book book, double score) {
                this.book = book;
                this.score = score;
            }
        }

        List<ScoredBook> scored = new ArrayList<>();

        for (Book b : candidates) {
            double score = 0.0;

            if ("CATEGORY".equals(activeTab)) {
                // TAB 1: THE LOAI YEU THICH
                if (b.getCategory() != null && categoryScores.containsKey(b.getCategory().getId())) {
                    score += categoryScores.get(b.getCategory().getId()) * 10.0;
                }
                if (!allBorrowedBookIds.contains(b.getId())) score += 15.0;
                if (b.getQuantityAvailable() != null && b.getQuantityAvailable() > 0) score += 20.0;
            } else if ("AUTHOR".equals(activeTab)) {
                // TAB 2: TAC GIA THUONG THEO DOI
                if (b.getAuthors() != null) {
                    for (Author a : b.getAuthors()) {
                        if (authorScores.containsKey(a.getId())) {
                            score += authorScores.get(a.getId()) * 10.0;
                        }
                    }
                }
                if (!allBorrowedBookIds.contains(b.getId())) score += 15.0;
                if (b.getQuantityAvailable() != null && b.getQuantityAvailable() > 0) score += 20.0;
            } else {
                // TAB 3: SACH DUOC YEU THICH (MUON NHIEU NHAT TOAN HE THONG)
                long borrows = globalBorrowCounts.getOrDefault(b.getId(), 0L);
                score += borrows * 10.0;
                if (!allBorrowedBookIds.contains(b.getId())) score += 5.0;
                if (b.getQuantityAvailable() != null && b.getQuantityAvailable() > 0) score += 10.0;
            }

            scored.add(new ScoredBook(b, score));
        }

        // 5. Sap xep giam dan theo diem so
        scored.sort((a, b) -> {
            int cmp = Double.compare(b.score, a.score);
            if (cmp != 0) return cmp;
            if (a.book.getCreatedAt() != null && b.book.getCreatedAt() != null) {
                return b.book.getCreatedAt().compareTo(a.book.getCreatedAt());
            }
            return Long.compare(b.book.getId(), a.book.getId());
        });

        // 6. Lay top safeLimit cuon va tra ve BookResponse
        return scored.stream()
                .limit(safeLimit)
                .map(s -> toResponse(s.book))
                .collect(Collectors.toList());
    }

    @Override
    public BookResponse getById(Long id) {
        return toResponse(findBookOrThrow(id));
    }

    @Override
    @Transactional
    public BookResponse create(BookRequest request) {
        if (bookRepository.existsByIsbn(request.getIsbn())) {
            throw new BadRequestException("ISBN này đã tồn tại trong hệ thống.");
        }
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thể loại sách."));

        Book book = Book.builder()
                .isbn(request.getIsbn())
                .title(request.getTitle())
                .description(request.getDescription())
                .quantityTotal(request.getQuantityTotal())
                .quantityAvailable(request.getQuantityTotal())
                .imgUrl(request.getImgUrl())
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
            throw new BadRequestException("ISBN này đã tồn tại trong hệ thống.");
        }
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thể loại sách."));

        int borrowed = book.getQuantityTotal() - book.getQuantityAvailable();
        if (request.getQuantityTotal() < borrowed) {
            throw new BadRequestException("Số lượng mới (" + request.getQuantityTotal()
                    + ") không được nhỏ hơn số lượng đang được mượn (" + borrowed + ").");
        }

        book.setIsbn(request.getIsbn());
        book.setTitle(request.getTitle());
        book.setDescription(request.getDescription());
        book.setQuantityAvailable(request.getQuantityTotal() - borrowed);
        book.setQuantityTotal(request.getQuantityTotal());
        book.setImgUrl(request.getImgUrl());
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
            throw new BadRequestException("Không thể xoá sách đang có người mượn");
        }
        if (borrowRecordRepository.existsByBook_Id(id)) {
            throw new BadRequestException("Sách này đã có trong lịch sử mượn trả của thư viện, không thể xoá để bảo toàn dữ liệu thống kê. Bạn có thể cập nhật số lượng kho về 0 nếu ngừng lưu hành.");
        }
        bookRepository.delete(book);
        log.info("Xoa sach: id={}", id);
    }

    @Override
    @Transactional
    public BookResponse discontinue(Long id) {
        Book book = findBookOrThrow(id);
        book.setStatus(BookStatus.DISCONTINUED);
        book = bookRepository.save(book);
        log.info("Ngung luu hanh sach: id={}, title={}", id, book.getTitle());
        return toResponse(book);
    }

    @Override
    @Transactional
    public BookResponse restore(Long id) {
        Book book = findBookOrThrow(id);
        book.setStatus(BookStatus.IN_CIRCULATION);
        book = bookRepository.save(book);
        log.info("Tai phat hanh sach: id={}, title={}", id, book.getTitle());
        return toResponse(book);
    }

    @Override
    @Transactional
    public int importFromCsv(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Tệp tải lên rỗng hoặc không tồn tại.");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException("Tệp vượt quá dung lượng cho phép (tối đa 5MB).");
        }
        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".csv")) {
            throw new BadRequestException("Hệ thống chỉ hỗ trợ tệp định dạng .csv.");
        }

        int importedCount = 0;
        try (var reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8)) {
            CSVParser parser = CSVFormat.DEFAULT.withFirstRecordAsHeader().withTrim().parse(reader);
            for (CSVRecord record : parser) {
                importedCount += importOneRow(record);
            }
        } catch (IOException e) {
            throw new BadRequestException("Không đọc được nội dung tệp CSV: " + e.getMessage());
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
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách với mã ID=" + id));
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
                .status(book.getStatus() != null ? book.getStatus().name() : BookStatus.IN_CIRCULATION.name())
                .imgUrl(book.getImgUrl())
                .build();
    }
}
