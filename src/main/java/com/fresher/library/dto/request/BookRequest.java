package com.fresher.library.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class BookRequest {

    @NotBlank(message = "ISBN khong duoc de trong")
    private String isbn;

    @NotBlank(message = "Ten sach khong duoc de trong")
    private String title;

    private String description;

    @NotNull(message = "So luong khong duoc de trong")
    @Min(value = 0, message = "So luong phai >= 0")
    private Integer quantityTotal;

    @NotNull(message = "Phai chon the loai sach")
    private Long categoryId;

    /** Danh sach ten tac gia - he thong se tu tao Author moi neu chua ton tai (quan he N-N) */
    private List<String> authorNames;
}
