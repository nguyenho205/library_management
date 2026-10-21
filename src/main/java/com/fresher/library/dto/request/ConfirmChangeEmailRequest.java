package com.fresher.library.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ConfirmChangeEmailRequest {

    @NotBlank(message = "Email mới không được để trống.")
    @Email(message = "Email không đúng định dạng.")
    private String newEmail;

    @NotBlank(message = "Mã xác thực không được để trống.")
    @Pattern(regexp = "^\\d{6}$", message = "Mã xác thực phải gồm đúng 6 chữ số.")
    private String code;
}
