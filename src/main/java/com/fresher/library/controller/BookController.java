package com.fresher.library.controller;

import com.fresher.library.dto.request.BookRequest;
import com.fresher.library.dto.response.ApiResponse;
import com.fresher.library.dto.response.BookResponse;
import com.fresher.library.dto.response.PageResponse;
import com.fresher.library.entity.BookStatus;
import com.fresher.library.service.BookService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * Chuc nang: QUAN LY SACH
 * - GET  /api/books        : search phan trang theo title/isbn/author/category/status - moi user da dang nhap deu xem duoc
 * - GET  /api/books/{id}   : xem chi tiet 1 sach
 * - POST /api/books        : them sach moi (chi ADMIN)
 * - PUT  /api/books/{id}   : sua sach (chi ADMIN)
 * - PUT  /api/books/{id}/discontinue : ngung luu hanh sach (chi ADMIN)
 * - PUT  /api/books/{id}/restore     : tai phat hanh sach (chi ADMIN)
 * - DELETE /api/books/{id} : xoa sach (chi ADMIN)
 * - POST /api/books/import : import danh sach sach tu file CSV, gioi han 5MB (chi ADMIN)
 * (Phan quyen chi tiet cau hinh o SecurityConfig)
 */
@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
@Tag(name = "Book", description = "Quan ly sach: tim kiem, them, sua, ngung luu hanh, tai phat hanh, xoa, import CSV")
public class BookController {

    private final BookService bookService;

    @GetMapping
    @PreAuthorize("hasAuthority('BOOK_VIEW')")
    public ResponseEntity<ApiResponse<PageResponse<BookResponse>>> search(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String isbn,
            @RequestParam(required = false) String author,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) BookStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            org.springframework.security.core.Authentication authentication) {
        BookStatus effectiveStatus = status;
        boolean isStaff = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")
                        || a.getAuthority().equals("BOOK_UPDATE")
                        || a.getAuthority().equals("BOOK_CREATE"));
        // Neu la doc gia binh thuong, mac dinh chi hien thi sach DANG PHAT HANH
        if (!isStaff && effectiveStatus == null) {
            effectiveStatus = BookStatus.IN_CIRCULATION;
        }
        var result = bookService.search(title, isbn, author, categoryId, effectiveStatus, page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/recommendations")
    @PreAuthorize("hasAuthority('BOOK_VIEW')")
    public ResponseEntity<ApiResponse<java.util.List<BookResponse>>> getRecommendations(
            org.springframework.security.core.Authentication authentication,
            @RequestParam(defaultValue = "CATEGORY") String tab,
            @RequestParam(defaultValue = "4") int limit) {
        String email = authentication != null ? authentication.getName() : null;
        java.util.List<BookResponse> recommendations = bookService.getRecommendations(email, tab, limit);
        return ResponseEntity.ok(ApiResponse.success(recommendations));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('BOOK_VIEW')")
    public ResponseEntity<ApiResponse<BookResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(bookService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('BOOK_CREATE')")
    public ResponseEntity<ApiResponse<BookResponse>> create(@Valid @RequestBody BookRequest request) {
        BookResponse created = bookService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Them sach thanh cong", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('BOOK_UPDATE')")
    public ResponseEntity<ApiResponse<BookResponse>> update(@PathVariable Long id,
                                                              @Valid @RequestBody BookRequest request) {
        BookResponse updated = bookService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cap nhat sach thanh cong", updated));
    }

    @PutMapping("/{id}/discontinue")
    @PreAuthorize("hasAuthority('BOOK_UPDATE')")
    public ResponseEntity<ApiResponse<BookResponse>> discontinue(@PathVariable Long id) {
        BookResponse updated = bookService.discontinue(id);
        return ResponseEntity.ok(ApiResponse.success("Da chuyen sach sang trang thai ngung luu hanh", updated));
    }

    @PutMapping("/{id}/restore")
    @PreAuthorize("hasAuthority('BOOK_UPDATE')")
    public ResponseEntity<ApiResponse<BookResponse>> restore(@PathVariable Long id) {
        BookResponse updated = bookService.restore(id);
        return ResponseEntity.ok(ApiResponse.success("Da khoi phuc luu hanh sach thanh cong", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('BOOK_DELETE')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        bookService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xoa sach thanh cong", null));
    }

    @PostMapping(value = "/import", consumes = "multipart/form-data")
    @PreAuthorize("hasAuthority('BOOK_IMPORT')")
    public ResponseEntity<ApiResponse<Integer>> importCsv(@RequestParam("file") MultipartFile file) {
        int imported = bookService.importFromCsv(file);
        return ResponseEntity.ok(ApiResponse.success("Import thanh cong " + imported + " sach moi", imported));
    }
}
