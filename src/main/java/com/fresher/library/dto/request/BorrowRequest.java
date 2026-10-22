package com.fresher.library.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BorrowRequest {

    @NotNull(message = "Phải chọn sách cần mượn.")
    private Long bookId;
}
