package com.fresher.library.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberResponse {
    private Long id;
    private String fullName;
    private String email;
    private LocalDate dateOfBirth;
    private String phone;
    private String address;
    private boolean emailVerified;
    private boolean enabled;
}
