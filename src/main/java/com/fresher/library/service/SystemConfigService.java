package com.fresher.library.service;

import com.fresher.library.dto.request.SystemConfigRequest;
import com.fresher.library.dto.response.SystemConfigResponse;

/**
 * Quan ly cau hinh he thong (hien tai chi co maintenance mode).
 */
public interface SystemConfigService {
    SystemConfigResponse getConfig();
    SystemConfigResponse updateMaintenanceMode(SystemConfigRequest request, String updatedBy);
}
