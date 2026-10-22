package com.fresher.library.controller;

import com.fresher.library.dto.request.MemberUpdateRequest;
import com.fresher.library.dto.request.RegisterRequest;
import com.fresher.library.dto.response.ApiResponse;
import com.fresher.library.dto.response.MemberResponse;
import com.fresher.library.dto.response.PageResponse;
import com.fresher.library.service.MemberService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * Chuc nang: QUAN LY MEMBER (chi ADMIN - xem SecurityConfig)
 * - GET  /api/members      : search theo ten/email/sach da muon/khoang ngay sinh, phan trang
 * - GET  /api/members/{id} : xem chi tiet 1 member
 * - POST /api/members      : tao member moi (admin tao truc tiep, khong can verify email)
 * - PUT  /api/members/{id} : cap nhat thong tin member
 * - DELETE /api/members/{id} : xoa member
 */
@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
@Tag(name = "Member", description = "Quan ly thanh vien thu vien (chi Admin)")
public class MemberController {

    private final MemberService memberService;

    @GetMapping
    @PreAuthorize("hasAuthority('MEMBER_VIEW')")
    public ResponseEntity<ApiResponse<PageResponse<MemberResponse>>> search(
            @RequestParam(required = false) String fullName,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String bookTitle,
            @RequestParam(required = false) Long bookId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dobFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dobTo,
            @RequestParam(required = false) Boolean enabled,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        var result = memberService.search(fullName, email, bookTitle, bookId, dobFrom, dobTo, enabled, page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('MEMBER_VIEW')")
    public ResponseEntity<ApiResponse<MemberResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(memberService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('MEMBER_CREATE')")
    public ResponseEntity<ApiResponse<MemberResponse>> create(@Valid @RequestBody RegisterRequest request) {
        MemberResponse created = memberService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tao member thanh cong", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('MEMBER_UPDATE')")
    public ResponseEntity<ApiResponse<MemberResponse>> update(@PathVariable Long id,
                                                                @Valid @RequestBody MemberUpdateRequest request) {
        MemberResponse updated = memberService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cap nhat member thanh cong", updated));
    }

    @PutMapping("/{id}/lock")
    @PreAuthorize("hasAuthority('MEMBER_UPDATE')")
    public ResponseEntity<ApiResponse<MemberResponse>> lock(@PathVariable Long id) {
        MemberResponse updated = memberService.lock(id);
        return ResponseEntity.ok(ApiResponse.success("Khoá tài khoản thành viên thành công", updated));
    }

    @PutMapping("/{id}/unlock")
    @PreAuthorize("hasAuthority('MEMBER_UPDATE')")
    public ResponseEntity<ApiResponse<MemberResponse>> unlock(@PathVariable Long id) {
        MemberResponse updated = memberService.unlock(id);
        return ResponseEntity.ok(ApiResponse.success("Mở khoá tài khoản thành viên thành công", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('MEMBER_DELETE')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        memberService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xoa member thanh cong", null));
    }
}
