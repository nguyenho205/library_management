package com.fresher.library.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RefreshTokenRequest {

    @NotBlank(message = "Mã làm mới phiên (refreshToken) không được để trống.")
    private String refreshToken;
}
