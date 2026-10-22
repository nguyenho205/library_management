package com.fresher.library.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignGroupsRequest {

    @NotNull(message = "Mã nhóm quyền (groupId) không được để trống.")
    private Long groupId;
}
