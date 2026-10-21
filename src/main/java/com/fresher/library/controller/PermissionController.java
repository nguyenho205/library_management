package com.fresher.library.controller;

import com.fresher.library.dto.request.AssignGroupsRequest;
import com.fresher.library.dto.request.PermissionGroupRequest;
import com.fresher.library.dto.response.*;
import com.fresher.library.service.PermissionService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Chuc nang: PHAN QUYEN THEO NHOM CHUC NANG (chi user co quyen PERMISSION_MANAGE)
 * - GET    /api/permissions                       : danh sach tat ca quyen nho
 * - GET    /api/permission-groups                 : danh sach nhom quyen
 * - POST   /api/permission-groups                 : tao nhom quyen
 * - PUT    /api/permission-groups/{id}            : sua nhom quyen
 * - DELETE /api/permission-groups/{id}            : xoa nhom quyen
 * - GET    /api/accounts                          : danh sach tai khoan + nhom quyen dang co
 * - PUT    /api/accounts/{id}/permission-groups   : gan nhom quyen cho tai khoan
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('PERMISSION_MANAGE')")
@Tag(name = "Permission", description = "Phan quyen theo nhom chuc nang")
public class PermissionController {

    private final PermissionService permissionService;

    @GetMapping("/permissions")
    public ResponseEntity<ApiResponse<List<PermissionResponse>>> listPermissions() {
        return ResponseEntity.ok(ApiResponse.success(permissionService.listPermissions()));
    }

    @GetMapping("/permission-groups")
    public ResponseEntity<ApiResponse<List<PermissionGroupResponse>>> listGroups() {
        return ResponseEntity.ok(ApiResponse.success(permissionService.listGroups()));
    }

    @PostMapping("/permission-groups")
    public ResponseEntity<ApiResponse<PermissionGroupResponse>> createGroup(@Valid @RequestBody PermissionGroupRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Tao nhom quyen thanh cong", permissionService.createGroup(request)));
    }

    @PutMapping("/permission-groups/{id}")
    public ResponseEntity<ApiResponse<PermissionGroupResponse>> updateGroup(@PathVariable Long id,
                                                                              @Valid @RequestBody PermissionGroupRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cap nhat nhom quyen thanh cong", permissionService.updateGroup(id, request)));
    }

    @DeleteMapping("/permission-groups/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteGroup(@PathVariable Long id) {
        permissionService.deleteGroup(id);
        return ResponseEntity.ok(ApiResponse.success("Xoa nhom quyen thanh cong", null));
    }

    @GetMapping("/accounts")
    public ResponseEntity<ApiResponse<PageResponse<AccountPermissionResponse>>> listAccounts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(permissionService.listAccounts(page, size)));
    }

    @PutMapping("/accounts/{accountId}/permission-groups")
    public ResponseEntity<ApiResponse<AccountPermissionResponse>> assignGroups(@PathVariable Long accountId,
                                                                                 @Valid @RequestBody AssignGroupsRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Gan nhom quyen thanh cong",
                permissionService.assignGroups(accountId, request)));
    }
}
