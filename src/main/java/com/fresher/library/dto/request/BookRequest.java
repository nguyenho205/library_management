package com.fresher.library.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class BookRequest {

    @NotBlank(message = "ISBN không được để trống.")
    private String isbn;

    @NotBlank(message = "Tên sách không được để trống.")
    private String title;

    private String description;

    @NotNull(message = "Số lượng không được để trống.")
    @Min(value = 0, message = "Số lượng phải lớn hơn hoặc bằng 0.")
    private Integer quantityTotal;

    @NotNull(message = "Phải chọn thể loại sách.")
    private Long categoryId;

    /** Danh sach ten tac gia - he thong se tu tao Author moi neu chua ton tai (quan he N-N) */
    private List<String> authorNames;

    /** Duong dan anh bia sach (URL) */
    private String imgUrl;
}
