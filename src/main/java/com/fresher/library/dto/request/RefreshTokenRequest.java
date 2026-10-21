package com.fresher.library.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RefreshTokenRequest {

    @NotBlank(message = "refreshToken khong duoc de trong")
    private String refreshToken;
}
