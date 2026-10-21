package com.fresher.library.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ChangePasswordRequest {

    @NotBlank(message = "Mat khau cu khong duoc de trong")
    private String oldPassword;

    @NotBlank(message = "Mat khau moi khong duoc de trong")
    @Pattern(
            regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).{8,}$",
            message = "Mat khau toi thieu 8 ky tu, gom chu hoa, chu thuong, so va ky tu dac biet"
    )
    private String newPassword;
}
