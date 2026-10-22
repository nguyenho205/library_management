package com.fresher.library.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import lombok.Data;

import java.time.LocalDate;

@Data
public class MemberUpdateRequest {

    @NotBlank(message = "Họ tên không được để trống.")
    private String fullName;

    @Past(message = "Ngày sinh phải là ngày trong quá khứ.")
    private LocalDate dateOfBirth;

    private String phone;

    private String address;
}
