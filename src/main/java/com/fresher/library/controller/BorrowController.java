package com.fresher.library.controller;

import com.fresher.library.dto.request.BorrowRequest;
import com.fresher.library.dto.response.ApiResponse;
import com.fresher.library.dto.response.BorrowRecordResponse;
import com.fresher.library.service.BorrowService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Chuc nang: MUON / TRA SACH (yeu cau: moi user (da dang nhap) deu goi duoc, tu phan biet qua email dang nhap)
 * - POST /api/borrow        : muon sach - validate ton kho + rule "1 user chi muon 1 loai sach tai 1 thoi diem"
 * - POST /api/borrow/{id}/return : tra sach theo id phieu muon
 * - GET  /api/borrow/history : xem lich su muon sach cua chinh minh
 */
@RestController
@RequestMapping("/api/borrow")
@RequiredArgsConstructor
@Tag(name = "Borrow", description = "Muon / tra sach")
public class BorrowController {

    private final BorrowService borrowService;

    @PostMapping
    @PreAuthorize("hasAuthority('BORROW_USE')")
    public ResponseEntity<ApiResponse<BorrowRecordResponse>> borrow(Authentication authentication,
                                                                      @Valid @RequestBody BorrowRequest request) {
        BorrowRecordResponse result = borrowService.borrowBook(authentication.getName(), request.getBookId());
        return ResponseEntity.ok(ApiResponse.success("Muon sach thanh cong", result));
    }

    @PostMapping("/{borrowRecordId}/return")
    @PreAuthorize("hasAuthority('BORROW_USE')")
    public ResponseEntity<ApiResponse<BorrowRecordResponse>> returnBook(Authentication authentication,
                                                                          @PathVariable Long borrowRecordId) {
        BorrowRecordResponse result = borrowService.returnBook(authentication.getName(), borrowRecordId);
        return ResponseEntity.ok(ApiResponse.success("Tra sach thanh cong", result));
    }

    @GetMapping("/history")
    @PreAuthorize("hasAuthority('BORROW_USE')")
    public ResponseEntity<ApiResponse<List<BorrowRecordResponse>>> history(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(borrowService.getMyBorrowHistory(authentication.getName())));
    }
}
