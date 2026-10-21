package com.fresher.library.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountPermissionResponse {
    private Long accountId;
    private String email;
    private String role;
    private PermissionGroupResponse group;
}
