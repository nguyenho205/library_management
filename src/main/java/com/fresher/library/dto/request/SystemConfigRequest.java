package com.fresher.library.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SystemConfigRequest {

    @NotNull(message = "Chế độ bảo trì (maintenanceMode) không được để trống.")
    private Boolean maintenanceMode;
}
