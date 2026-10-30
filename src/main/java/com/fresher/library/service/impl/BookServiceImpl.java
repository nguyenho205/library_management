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
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
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
                    authorScores.merge(a.getId(), recencyWeight * 5, Integer::sum);
                }
            }
        }

        List<Book> availableBooks = bookRepository.findAll().stream()
                .filter(b -> b.getStatus() == BookStatus.IN_CIRCULATION)
                .filter(b -> !currentlyBorrowedBookIds.contains(b.getId()))
                .collect(Collectors.toList());

        List<Book> scoredBooks = new ArrayList<>(availableBooks);

        if ("CATEGORY".equals(activeTab)) {
            scoredBooks.sort((b1, b2) -> {
                int s1 = (b1.getCategory() != null) ? categoryScores.getOrDefault(b1.getCategory().getId(), 0) : 0;
                int s2 = (b2.getCategory() != null) ? categoryScores.getOrDefault(b2.getCategory().getId(), 0) : 0;
                if (s1 != s2) return Integer.compare(s2, s1);
                return Long.compare(b2.getId(), b1.getId());
            });
        } else if ("AUTHOR".equals(activeTab)) {
            scoredBooks.sort((b1, b2) -> {
                int s1 = 0;
                if (b1.getAuthors() != null) {
                    for (Author a : b1.getAuthors()) s1 += authorScores.getOrDefault(a.getId(), 0);
                }
                int s2 = 0;
                if (b2.getAuthors() != null) {
                    for (Author a : b2.getAuthors()) s2 += authorScores.getOrDefault(a.getId(), 0);
                }
                if (s1 != s2) return Integer.compare(s2, s1);
                return Long.compare(b2.getId(), b1.getId());
            });
        } else {
            // POPULAR / FALLBACK
            Map<Long, Long> borrowCounts = borrowRecordRepository.findAll().stream()
                    .filter(r -> r.getBook() != null)
                    .collect(Collectors.groupingBy(r -> r.getBook().getId(), Collectors.counting()));

            scoredBooks.sort((b1, b2) -> {
                long c1 = borrowCounts.getOrDefault(b1.getId(), 0L);
                long c2 = borrowCounts.getOrDefault(b2.getId(), 0L);
                if (c1 != c2) return Long.compare(c2, c1);
                return Long.compare(b2.getId(), b1.getId());
            });
        }

        return scoredBooks.stream()
                .limit(safeLimit)
                .map(this::toResponse)
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

        String coverImg = request.getImgUrl();
        if (coverImg == null || coverImg.isBlank()) {
            coverImg = resolveDefaultCover(request.getTitle());
        }

        Book book = Book.builder()
                .isbn(request.getIsbn())
                .title(request.getTitle())
                .description(request.getDescription())
                .quantityTotal(request.getQuantityTotal())
                .quantityAvailable(request.getQuantityTotal())
                .imgUrl(coverImg)
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

        String cover = record.isMapped("imgUrl") && !record.get("imgUrl").isBlank()
                ? record.get("imgUrl").trim()
                : resolveDefaultCover(record.get("title"));

        Book book = Book.builder()
                .isbn(isbn)
                .title(record.get("title"))
                .description(record.isMapped("description") ? record.get("description") : null)
                .quantityTotal(quantity)
                .quantityAvailable(quantity)
                .imgUrl(cover)
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

    @Override
    public String uploadCover(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Vui lòng chọn tệp ảnh bìa sách.");
        }
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        }
        if (!List.of(".jpg", ".jpeg", ".png", ".webp", ".gif").contains(extension)) {
            throw new BadRequestException("Định dạng tệp không hợp lệ. Chỉ chấp nhận các định dạng ảnh: JPG, JPEG, PNG, WEBP, GIF.");
        }

        // Tên file lưu trên ổ đĩa
        String safeName = "cover_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8) + extension;

        try {
            // 1. Lưu vào thư mục frontend/public/anhbia
            Path destFrontend = Paths.get("frontend/public/anhbia").toAbsolutePath().normalize();
            if (!Files.exists(destFrontend)) {
                Files.createDirectories(destFrontend);
            }
            Path targetFile = destFrontend.resolve(safeName);
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);

            // 2. Đồng bộ sang public/anhbia ở root (nếu có)
            try {
                Path destRoot = Paths.get("public/anhbia").toAbsolutePath().normalize();
                if (!Files.exists(destRoot)) {
                    Files.createDirectories(destRoot);
                }
                Files.copy(targetFile, destRoot.resolve(safeName), StandardCopyOption.REPLACE_EXISTING);
            } catch (Exception ignored) {
            }

            log.info("Đã tải lên ảnh bìa mới: {}", safeName);
            // Trả về link tương đối để lưu vào cơ sở dữ liệu
            return "/anhbia/" + safeName;
        } catch (IOException e) {
            log.error("Không thể lưu ảnh bìa: {}", e.getMessage(), e);
            throw new BadRequestException("Lỗi lưu trữ tệp ảnh bìa: " + e.getMessage());
        }
    }

    public static String resolveDefaultCover(String title) {
        if (title == null || title.isBlank()) return null;
        String t = title.toLowerCase();
        if (t.contains("tắt đèn") || t.contains("tat den")) return "/anhbia/tatden.jpg";
        if (t.contains("số đỏ") || t.contains("so do")) return "/anhbia/sodo.webp";
        if (t.contains("truyện kiều") || t.contains("truyen kieu")) return "/anhbia/truyenkieu.webp";
        if (t.contains("nhà giả kim") || t.contains("nha gia kim")) return "/anhbia/nhagiakim.jpg";
        if (t.contains("đắc nhân tâm") || t.contains("dac nhan tam")) return "/anhbia/dacnhantam.jpg";
        if (t.contains("dế mèn") || t.contains("de men")) return "/anhbia/demenphieuluuky.jpg";
        if (t.contains("giải tích") || t.contains("giai tich") || t.contains("toán")) return "/anhbia/giaitich1.jpg";
        if (t.contains("lược sử thời gian") || t.contains("luoc su thoi gian")) return "/anhbia/luocsuthoigian.webp";
        if (t.contains("lược sử loài người") || t.contains("sapiens") || t.contains("luoc su loai nguoi")) return "/anhbia/luocsuloainguoi.jpg";
        if (t.contains("vật lý") || t.contains("vat ly")) return "/anhbia/vatlydaicuong.png";
        if (t.contains("clean architecture") || t.contains("clean code")) return "/anhbia/CleanArchitecture.jpg";
        if (t.contains("spring in action") || t.contains("spring boot in action")) return "/anhbia/springbootinaction.webp";
        if (t.contains("spring")) return "/anhbia/springboot.jpg";
        if (t.contains("cấu trúc dữ liệu") || t.contains("cau truc du lieu") || t.contains("giải thuật") || t.contains("giai thuat")) return "/anhbia/cautrucdulieuvagiaithuat.jpg";
        if (t.contains("cơ sở dữ liệu") || t.contains("co so du lieu") || t.contains("database")) return "/anhbia/cosodulieuquanhe.jpg";
        if (t.contains("mạng máy tính") || t.contains("mang may tinh") || t.contains("network")) return "/anhbia/mangmaytinh.jpg";
        if (t.contains("java")) return "/anhbia/javacore.jpg";
        return null;
    }
}
