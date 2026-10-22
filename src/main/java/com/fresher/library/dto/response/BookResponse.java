package com.fresher.library.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookResponse {
    private Long id;
    private String isbn;
    private String title;
    private String description;
    private Integer quantityTotal;
    private Integer quantityAvailable;
    private String categoryName;
    private Long categoryId;
    private List<String> authorNames;
    private LocalDateTime createdAt;
    private String status;
}
