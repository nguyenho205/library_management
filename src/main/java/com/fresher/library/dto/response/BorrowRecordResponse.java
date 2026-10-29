package com.fresher.library.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BorrowRecordResponse {
    private Long id;
    private Long bookId;
    private String bookTitle;
    private String bookImgUrl;
    private Long memberId;
    private String memberName;
    private String memberEmail;
    private LocalDate borrowDate;
    private LocalDate dueDate;
    private LocalDate returnDate;
    private String status;
    private boolean overdue;
    private Long overdueDays;
    private BigDecimal penaltyAmount;
    private BigDecimal penaltyRatePerDay;
    private String bookCondition;
    private BigDecimal damageFee;
    private String returnNotes;
    private String returnedBy;
    private BigDecimal totalFineAmount;
}
