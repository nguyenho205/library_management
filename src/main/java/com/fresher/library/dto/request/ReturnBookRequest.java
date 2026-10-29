package com.fresher.library.dto.request;

import com.fresher.library.entity.BookCondition;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReturnBookRequest {
    private BookCondition condition;
    private BigDecimal damageFee;
    private String notes;
}
