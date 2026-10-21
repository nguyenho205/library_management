package com.fresher.library.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CategoryRequest {

    @NotBlank(message = "Ten the loai khong duoc de trong")
    @Size(max = 100, message = "Ten the loai toi da 100 ky tu")
    private String name;
}
