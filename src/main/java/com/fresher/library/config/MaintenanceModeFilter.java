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
import java.nio.charset.StandardCharsets;

/**
 * Khi maintenanceMode = true, chan toan bo request cua nguoi dung thuong.
 * Admin dang co phien hop le van duoc truy cap de ket thuc bao tri.
 */
@Component
@RequiredArgsConstructor
@Order(1)
public class MaintenanceModeFilter extends OncePerRequestFilter {

    private final SystemConfigRepository systemConfigRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String MAINTENANCE_STATUS_PATH = "/api/config/maintenance-status";
    private static final String REFRESH_PATH = "/api/auth/refresh";
    private static final String[] AUTH_ENTRY_POINTS = {"/api/auth/login", "/api/auth/register"};

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String uri = request.getRequestURI();
        boolean maintenance = systemConfigRepository.findById(1L)
                .map(cfg -> cfg.isMaintenanceMode())
                .orElse(false);

        if (!maintenance || "OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        if ("GET".equalsIgnoreCase(request.getMethod()) && MAINTENANCE_STATUS_PATH.equals(uri)) {
            filterChain.doFilter(request, response);
            return;
        }

        for (String path : AUTH_ENTRY_POINTS) {
            if (path.equals(uri)) {
                writeMaintenanceResponse(response);
                return;
            }
        }

        String bearer = request.getHeader("Authorization");
        if ("POST".equalsIgnoreCase(request.getMethod()) && REFRESH_PATH.equals(uri)
                && isAdminRefreshToken(bearer)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Keep admin access so an administrator can turn maintenance mode off.
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            String token = bearer.substring(7);
            try {
                if (jwtTokenProvider.validateToken(token)
                        && "ADMIN".equalsIgnoreCase(jwtTokenProvider.getRoleFromToken(token))) {
                    filterChain.doFilter(request, response);
                    return;
                }
            } catch (Exception ignored) {
                // Invalid tokens do not bypass maintenance mode.
            }
        }

        writeMaintenanceResponse(response);
    }

    private boolean isAdminRefreshToken(String bearer) {
        if (!StringUtils.hasText(bearer) || !bearer.startsWith("Bearer ")) return false;
        try {
            String token = bearer.substring(7);
            return jwtTokenProvider.validateToken(token)
                    && "REFRESH".equals(jwtTokenProvider.getTokenKind(token))
                    && "ADMIN".equalsIgnoreCase(jwtTokenProvider.getRoleFromToken(token));
        } catch (Exception ignored) {
            return false;
        }
    }

    private void writeMaintenanceResponse(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8");
        response.getWriter().write(objectMapper.writeValueAsString(
                ApiResponse.error("Hệ thống đang bảo trì, vui lòng quay lại sau.")));
    }
}
