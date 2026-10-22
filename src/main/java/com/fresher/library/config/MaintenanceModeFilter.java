package com.fresher.library.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fresher.library.dto.response.ApiResponse;
import com.fresher.library.repository.SystemConfigRepository;
import com.fresher.library.security.JwtTokenProvider;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Khi maintenanceMode = true: chan API cua nguoi dung thuong,
 * CHI TRU API dang nhap, refresh, logout, API config, va cac request cua ADMIN (de admin thao tac he thong).
 * Dap ung yeu cau: "khi bat maintenance mode thi can chan tat ca API goi len he thong".
 */
@Component
@RequiredArgsConstructor
@Order(1)
public class MaintenanceModeFilter extends OncePerRequestFilter {

    private final SystemConfigRepository systemConfigRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String[] ALLOWED_WHEN_MAINTENANCE = {
            "/api/auth/login",
            "/api/auth/refresh",
            "/api/auth/logout",
            "/api/config"
    };

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String uri = request.getRequestURI();
        boolean allowed = false;
        for (String path : ALLOWED_WHEN_MAINTENANCE) {
            if (uri.startsWith(path)) {
                allowed = true;
                break;
            }
        }

        if (!allowed) {
            // Cho phep quan tri vien (ADMIN) truy cap ngay ca khi dang bao tri de kiem tra va van hanh he thong
            String bearer = request.getHeader("Authorization");
            if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
                String token = bearer.substring(7);
                try {
                    if (jwtTokenProvider.validateToken(token) && "ADMIN".equalsIgnoreCase(jwtTokenProvider.getRoleFromToken(token))) {
                        allowed = true;
                    }
                } catch (Exception ignored) {
                }
            }
        }

        if (!allowed) {
            boolean maintenance = systemConfigRepository.findById(1L)
                    .map(cfg -> cfg.isMaintenanceMode())
                    .orElse(false);

            if (maintenance) {
                response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write(objectMapper.writeValueAsString(
                        ApiResponse.error("Hệ thống đang bảo trì, vui lòng quay lại sau.")));
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
