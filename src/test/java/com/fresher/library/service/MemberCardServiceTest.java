package com.fresher.library.service;

import com.fresher.library.repository.BorrowRecordRepository;
import com.fresher.library.repository.MemberRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class MemberCardServiceTest {
    private final MemberRepository members = mock(MemberRepository.class);
    private final BorrowRecordRepository records = mock(BorrowRecordRepository.class);
    private final MemberCardService service = new MemberCardService(members, records);

    @Test
    void tierAndQuotaFollowQualifyingReturnsInRollingWindow() {
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusDays(29);
        long[] counts = {0, 2, 3, 5, 6};
        String[] tiers = {"STANDARD", "STANDARD", "SILVER", "SILVER", "GOLD"};
        int[] limits = {2, 2, 3, 3, 5};
        for (int i = 0; i < counts.length; i++) {
            when(records.countQualifyingReturns(10L, start, today)).thenReturn(counts[i]);
            var card = service.forMember(10L);
            assertThat(card.tier()).isEqualTo(tiers[i]);
            assertThat(card.maxActiveLoans()).isEqualTo(limits[i]);
            assertThat(card.qualifyingReturnsLast30Days()).isEqualTo(counts[i]);
        }
    }
}
