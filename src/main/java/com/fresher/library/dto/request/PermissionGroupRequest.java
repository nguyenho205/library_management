package com.fresher.library.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class PermissionGroupRequest {

    @NotBlank(message = "Tên nhóm quyền không được để trống.")
    @Size(max = 100, message = "Tên nhóm quyền tối đa 100 ký tự.")
    private String name;

    @Size(max = 255, message = "Mô tả tối đa 255 ký tự.")
    private String description;

    @NotEmpty(message = "Phải chọn ít nhất 1 quyền.")
    private List<String> permissionCodes;
}
