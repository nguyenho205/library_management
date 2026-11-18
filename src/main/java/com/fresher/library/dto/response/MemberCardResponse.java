package com.fresher.library.dto.response;

import java.time.LocalDate;

public record MemberCardResponse(String tier, String tierName, int maxActiveLoans,
                                 long qualifyingReturnsLast30Days, Integer nextTierAt,
                                 LocalDate periodStart, LocalDate periodEnd) {
}
