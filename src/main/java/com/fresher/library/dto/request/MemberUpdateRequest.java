package com.fresher.library.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import lombok.Data;

import java.time.LocalDate;

@Data
public class MemberUpdateRequest {

    @NotBlank(message = "Ho ten khong duoc de trong")
    private String fullName;

    @Past(message = "Ngay sinh phai la ngay trong qua khu")
    private LocalDate dateOfBirth;

    private String phone;

    private String address;
}
