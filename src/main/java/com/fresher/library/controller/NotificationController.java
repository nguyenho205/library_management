package com.fresher.library.controller;

import com.fresher.library.dto.response.ApiResponse;
import com.fresher.library.dto.response.NotificationResponse;
import com.fresher.library.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> list(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.list(authentication.getName())));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> unreadCount(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", notificationService.unreadCount(authentication.getName()))));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markRead(Authentication authentication, @PathVariable Long id) {
        notificationService.markRead(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu thông báo đã đọc.", null));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllRead(Authentication authentication) {
        notificationService.markAllRead(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Đã đọc tất cả thông báo.", null));
    }
}
