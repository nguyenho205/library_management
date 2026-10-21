package com.fresher.library.controller;

import com.fresher.library.dto.request.SystemConfigRequest;
import com.fresher.library.dto.response.ApiResponse;
import com.fresher.library.dto.response.SystemConfigResponse;
import com.fresher.library.service.SystemConfigService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Chuc nang: MAN HINH CONFIG HE THONG (chi ADMIN - xem SecurityConfig)
 * - GET /api/config          : xem config he thong hien tai
 * - PUT /api/config/maintenance : bat/tat maintenance mode
 *   (Khi maintenanceMode=true, MaintenanceModeFilter se chan toan bo API khac)
 */
@RestController
@RequestMapping("/api/config")
@RequiredArgsConstructor
@Tag(name = "SystemConfig", description = "Cau hinh he thong - maintenance mode (chi Admin)")
public class SystemConfigController {

    private final SystemConfigService systemConfigService;

    @GetMapping
    @PreAuthorize("hasAuthority('CONFIG_VIEW')")
    public ResponseEntity<ApiResponse<SystemConfigResponse>> getConfig() {
        return ResponseEntity.ok(ApiResponse.success(systemConfigService.getConfig()));
    }

    @PutMapping("/maintenance")
    @PreAuthorize("hasAuthority('CONFIG_UPDATE')")
    public ResponseEntity<ApiResponse<SystemConfigResponse>> updateMaintenance(
            Authentication authentication,
            @Valid @RequestBody SystemConfigRequest request) {
        var result = systemConfigService.updateMaintenanceMode(request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Cap nhat cau hinh thanh cong", result));
    }
}
