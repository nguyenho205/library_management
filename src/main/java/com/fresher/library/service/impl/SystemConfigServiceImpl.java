package com.fresher.library.service.impl;

import com.fresher.library.dto.request.SystemConfigRequest;
import com.fresher.library.dto.response.SystemConfigResponse;
import com.fresher.library.entity.SystemConfig;
import com.fresher.library.repository.SystemConfigRepository;
import com.fresher.library.service.SystemConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * API tat/bat maintenance mode + API hien thi config hien tai (yeu cau de bai:
 * "Man hinh config he thong: Viet API tat bat maintenance mode va API hien thi config hien tai").
 */
@Service
@RequiredArgsConstructor
@Log4j2
public class SystemConfigServiceImpl implements SystemConfigService {

    private static final Long CONFIG_ID = 1L;

    private final SystemConfigRepository systemConfigRepository;

    @Override
    public SystemConfigResponse getConfig() {
        SystemConfig config = getOrCreateConfig();
        return toResponse(config);
    }

    @Override
    @Transactional
    public SystemConfigResponse updateMaintenanceMode(SystemConfigRequest request, String updatedBy) {
        SystemConfig config = getOrCreateConfig();
        config.setMaintenanceMode(request.getMaintenanceMode());
        config.setUpdatedAt(LocalDateTime.now());
        config.setUpdatedBy(updatedBy);
        config = systemConfigRepository.save(config);
        log.info("Cap nhat maintenance mode = {} boi {}", config.isMaintenanceMode(), updatedBy);
        return toResponse(config);
    }

    private SystemConfig getOrCreateConfig() {
        return systemConfigRepository.findById(CONFIG_ID)
                .orElseGet(() -> systemConfigRepository.save(
                        SystemConfig.builder().id(CONFIG_ID).maintenanceMode(false).build()));
    }

    private SystemConfigResponse toResponse(SystemConfig config) {
        return SystemConfigResponse.builder()
                .maintenanceMode(config.isMaintenanceMode())
                .updatedAt(config.getUpdatedAt())
                .updatedBy(config.getUpdatedBy())
                .build();
    }
}
