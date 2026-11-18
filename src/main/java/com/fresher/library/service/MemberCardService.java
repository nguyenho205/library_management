package com.fresher.library.service;

import com.fresher.library.dto.response.MemberCardResponse;
import com.fresher.library.exception.ResourceNotFoundException;
import com.fresher.library.repository.BorrowRecordRepository;
import com.fresher.library.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class MemberCardService {
    private final MemberRepository memberRepository;
    private final BorrowRecordRepository borrowRecordRepository;

    @Transactional(readOnly = true)
    public MemberCardResponse forEmail(String email) {
        var member = memberRepository.findByAccount_Email(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thẻ thành viên"));
        return forMember(member.getId());
    }

    @Transactional(readOnly = true)
    public MemberCardResponse forMember(Long memberId) {
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusDays(29);
        long qualifying = borrowRecordRepository.countQualifyingReturns(memberId, start, today);
        if (qualifying >= 6) {
            return new MemberCardResponse("GOLD", "Vàng", 5, qualifying, null, start, today);
        }
        if (qualifying >= 3) {
            return new MemberCardResponse("SILVER", "Bạc", 3, qualifying, 6, start, today);
        }
        return new MemberCardResponse("STANDARD", "Tiêu chuẩn", 2, qualifying, 3, start, today);
    }
}
