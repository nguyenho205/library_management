package com.fresher.library.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CategoryRequest {

    @NotBlank(message = "Tên thể loại không được để trống.")
    @Size(max = 100, message = "Tên thể loại tối đa 100 ký tự.")
    private String name;
}
