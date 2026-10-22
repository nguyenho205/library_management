package com.fresher.library.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChangeEmailRequest {

    @NotBlank(message = "Email mới không được để trống.")
    @Email(message = "Email không đúng định dạng.")
    private String newEmail;
}
