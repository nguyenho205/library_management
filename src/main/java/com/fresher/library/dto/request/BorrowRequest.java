package com.fresher.library.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BorrowRequest {

    @NotNull(message = "Phai chon sach can muon")
    private Long bookId;
}
