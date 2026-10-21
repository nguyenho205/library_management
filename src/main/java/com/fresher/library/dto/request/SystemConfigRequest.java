package com.fresher.library.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SystemConfigRequest {

    @NotNull(message = "maintenanceMode khong duoc de trong")
    private Boolean maintenanceMode;
}
