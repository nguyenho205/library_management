package com.fresher.library.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignGroupsRequest {

    @NotNull(message = "groupId khong duoc de trong")
    private Long groupId;
}
