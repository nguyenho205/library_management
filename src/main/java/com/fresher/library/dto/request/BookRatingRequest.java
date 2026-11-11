package com.fresher.library.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class BookRatingRequest {
    @NotNull
    private Long borrowRecordId;

    @NotNull
    @Min(1)
    @Max(5)
    private Integer score;

    @Size(max = 1000)
    private String comment;
}
