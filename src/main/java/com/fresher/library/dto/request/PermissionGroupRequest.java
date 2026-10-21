package com.fresher.library.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class PermissionGroupRequest {

    @NotBlank(message = "Ten nhom quyen khong duoc de trong")
    @Size(max = 100, message = "Ten nhom quyen toi da 100 ky tu")
    private String name;

    @Size(max = 255, message = "Mo ta toi da 255 ky tu")
    private String description;

    @NotEmpty(message = "Phai chon it nhat 1 quyen")
    private List<String> permissionCodes;
}
