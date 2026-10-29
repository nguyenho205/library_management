package com.fresher.library.controller;

import com.fresher.library.dto.request.BorrowRequest;
import com.fresher.library.dto.response.ApiResponse;
import com.fresher.library.dto.response.BorrowRecordResponse;
import com.fresher.library.entity.BorrowStatus;
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
 * Chuc nang: MUON / TRA SACH theo quy trinh phe duyet
 * - POST /api/borrow                 : doc gia gui yeu cau muon sach (kem ngay hen tra tuy chon)
 * - POST /api/borrow/{id}/cancel     : doc gia tu huy yeu cau khi con PENDING
 * - POST /api/borrow/{id}/return     : tra sach theo id phieu muon (boi doc gia hoac thu thu)
 * - GET  /api/borrow/history         : xem lich su muon sach cua chinh minh
 * - GET  /api/borrow/admin/all       : admin xem toan bo ho so luu thong / loc theo status
 * - POST /api/borrow/{id}/approve    : admin phe duyet yeu cau muon
 * - POST /api/borrow/{id}/reject     : admin tu choi yeu cau muon
 */
@RestController
@RequestMapping("/api/borrow")
@RequiredArgsConstructor
@Tag(name = "Borrow", description = "Quy trinh muon, duyet, tra sach va quan ly qua han")
public class BorrowController {

    private final BorrowService borrowService;

    @PostMapping
    @PreAuthorize("hasAuthority('BORROW_USE')")
    public ResponseEntity<ApiResponse<BorrowRecordResponse>> requestBorrow(Authentication authentication,
                                                                          @Valid @RequestBody BorrowRequest request) {
        BorrowRecordResponse result = borrowService.requestBorrow(
                authentication.getName(),
                request.getBookId(),
                request.getRequestedDueDate());
        return ResponseEntity.ok(ApiResponse.success("Gửi yêu cầu mượn sách thành công, vui lòng chờ thủ thư phê duyệt.", result));
    }

    @PostMapping("/{borrowRecordId}/cancel")
    @PreAuthorize("hasAuthority('BORROW_USE')")
    public ResponseEntity<ApiResponse<BorrowRecordResponse>> cancelRequest(Authentication authentication,
                                                                          @PathVariable Long borrowRecordId) {
        BorrowRecordResponse result = borrowService.cancelRequest(authentication.getName(), borrowRecordId);
        return ResponseEntity.ok(ApiResponse.success("Đã huỷ yêu cầu mượn sách.", result));
    }

    @PostMapping("/{borrowRecordId}/return")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('BOOK_UPDATE') or hasAuthority('BORROW_USE')")
    public ResponseEntity<ApiResponse<BorrowRecordResponse>> returnBook(Authentication authentication,
                                                                          @PathVariable Long borrowRecordId,
                                                                          @RequestBody(required = false) com.fresher.library.dto.request.ReturnBookRequest request) {
        BorrowRecordResponse result = borrowService.returnBook(authentication.getName(), borrowRecordId, request);
        return ResponseEntity.ok(ApiResponse.success("Xác nhận kiểm tra tình trạng và duyệt trả sách thành công.", result));
    }

    @GetMapping("/history")
    @PreAuthorize("hasAuthority('BORROW_USE')")
    public ResponseEntity<ApiResponse<List<BorrowRecordResponse>>> history(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(borrowService.getMyBorrowHistory(authentication.getName())));
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('BOOK_UPDATE') or hasAuthority('BOOK_VIEW')")
    public ResponseEntity<ApiResponse<List<BorrowRecordResponse>>> getAllCirculation(
            @RequestParam(required = false) BorrowStatus status) {
        return ResponseEntity.ok(ApiResponse.success(borrowService.getAllCirculationRecords(status)));
    }

    @PostMapping("/{borrowRecordId}/approve")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('BOOK_UPDATE')")
    public ResponseEntity<ApiResponse<BorrowRecordResponse>> approveRequest(@PathVariable Long borrowRecordId) {
        BorrowRecordResponse result = borrowService.approveRequest(borrowRecordId);
        return ResponseEntity.ok(ApiResponse.success("Đã phê duyệt yêu cầu mượn sách", result));
    }

    @PostMapping("/{borrowRecordId}/reject")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('BOOK_UPDATE')")
    public ResponseEntity<ApiResponse<BorrowRecordResponse>> rejectRequest(@PathVariable Long borrowRecordId) {
        BorrowRecordResponse result = borrowService.rejectRequest(borrowRecordId);
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối yêu cầu mượn sách", result));
    }

    @PostMapping("/{borrowRecordId}/send-reminder")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('BOOK_UPDATE')")
    public ResponseEntity<ApiResponse<BorrowRecordResponse>> sendDueReminder(@PathVariable Long borrowRecordId) {
        BorrowRecordResponse result = borrowService.sendDueReminder(borrowRecordId);
        return ResponseEntity.ok(ApiResponse.success("Đã gửi email nhắc nhở hạn trả sách tới bạn đọc thành công.", result));
    }

    @PostMapping("/admin/send-due-reminders")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('BOOK_UPDATE')")
    public ResponseEntity<ApiResponse<Integer>> sendBatchDueReminders() {
        int count = borrowService.sendDueRemindersBatch();
        return ResponseEntity.ok(ApiResponse.success("Đã quét và gửi " + count + " email nhắc nhở tới các bạn đọc.", count));
    }
}
