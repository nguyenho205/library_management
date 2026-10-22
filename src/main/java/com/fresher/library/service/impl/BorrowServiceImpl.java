package com.fresher.library.service.impl;

import com.fresher.library.dto.response.BorrowRecordResponse;
import com.fresher.library.entity.Book;
import com.fresher.library.entity.BookStatus;
import com.fresher.library.entity.BorrowRecord;
import com.fresher.library.entity.BorrowStatus;
import com.fresher.library.entity.Member;
import com.fresher.library.exception.BadRequestException;
import com.fresher.library.exception.ForbiddenException;
import com.fresher.library.exception.ResourceNotFoundException;
import com.fresher.library.repository.BookRepository;
import com.fresher.library.repository.BorrowRecordRepository;
import com.fresher.library.repository.MemberRepository;
import com.fresher.library.service.BorrowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Nghiep vu muon/tra sach - yeu cau de bai:
 * "Muon sach (api): kiem tra so luong sach con trong kho, 1 user chi duoc muon 1 loai sach (1 cuon) tai 1 thoi diem"
 * "Tra sach (api)"
 * Moi thao tac ghi deu boc trong @Transactional: loi o buoc nao se rollback toan bo (vd tru kho that bai
 * thi ban ghi BorrowRecord cung khong duoc tao).
 */
@Service
@RequiredArgsConstructor
@Log4j2
public class BorrowServiceImpl implements BorrowService {

    private static final int LOAN_PERIOD_DAYS = 14;

    private final BorrowRecordRepository borrowRecordRepository;
    private final BookRepository bookRepository;
    private final MemberRepository memberRepository;

    @Override
    @Transactional
    public BorrowRecordResponse borrowBook(String email, Long bookId) {
        // Dung pessimistic lock tren Member de tranh race condition (vd nguoi dung bam 2 lan cung luc)
        Member member = memberRepository.findByAccount_EmailWithLock(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ thành viên cho tài khoản đang đăng nhập."));

        // Rule: 1 user chi duoc muon 1 loai sach (dang muon 1 cuon) tai 1 thoi diem
        if (borrowRecordRepository.existsByMember_IdAndStatus(member.getId(), BorrowStatus.BORROWED)) {
            throw new BadRequestException("Bạn đang mượn một cuốn sách khác. Vui lòng trả sách trước khi mượn sách mới.");
        }

        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách với mã ID=" + bookId));

        if (book.getStatus() == BookStatus.DISCONTINUED) {
            throw new BadRequestException("Sách \"" + book.getTitle() + "\" đã ngừng lưu hành, không thể mượn.");
        }

        if (book.getQuantityAvailable() <= 0) {
            throw new BadRequestException("Sách \"" + book.getTitle() + "\" hiện đã hết, không còn để mượn.");
        }

        book.setQuantityAvailable(book.getQuantityAvailable() - 1);
        bookRepository.save(book); // @Version tren Book giup phat hien xung dot khi nhieu request muon cung luc

        LocalDate today = LocalDate.now();
        BorrowRecord record = BorrowRecord.builder()
                .member(member)
                .book(book)
                .borrowDate(today)
                .dueDate(today.plusDays(LOAN_PERIOD_DAYS))
                .status(BorrowStatus.BORROWED)
                .build();
        record = borrowRecordRepository.save(record);

        log.info("Member id={} muon sach id={} ({}), con lai {} cuon",
                member.getId(), book.getId(), book.getTitle(), book.getQuantityAvailable());
        return toResponse(record);
    }

    @Override
    @Transactional
    public BorrowRecordResponse returnBook(String email, Long borrowRecordId) {
        Member member = getMemberByEmail(email);

        BorrowRecord record = borrowRecordRepository.findById(borrowRecordId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu mượn với mã ID=" + borrowRecordId));

        if (!record.getMember().getId().equals(member.getId())) {
            throw new ForbiddenException("Bạn không có quyền trả phiếu mượn này.");
        }
        if (record.getStatus() == BorrowStatus.RETURNED) {
            throw new BadRequestException("Phiếu mượn này đã được trả trước đó.");
        }

        record.setReturnDate(LocalDate.now());
        record.setStatus(BorrowStatus.RETURNED);
        borrowRecordRepository.save(record);

        Book book = record.getBook();
        book.setQuantityAvailable(book.getQuantityAvailable() + 1);
        bookRepository.save(book);

        log.info("Member id={} tra sach id={} ({})", member.getId(), book.getId(), book.getTitle());
        return toResponse(record);
    }

    @Override
    public List<BorrowRecordResponse> getMyBorrowHistory(String email) {
        return memberRepository.findByAccount_Email(email)
                .map(m -> m.getBorrowRecords().stream()
                        .map(this::toResponse)
                        .collect(Collectors.toList()))
                .orElse(java.util.Collections.emptyList());
    }

    private Member getMemberByEmail(String email) {
        return memberRepository.findByAccount_Email(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ thành viên cho tài khoản đang đăng nhập."));
    }

    private BorrowRecordResponse toResponse(BorrowRecord r) {
        return BorrowRecordResponse.builder()
                .id(r.getId())
                .bookId(r.getBook().getId())
                .bookTitle(r.getBook().getTitle())
                .memberId(r.getMember().getId())
                .memberName(r.getMember().getFullName())
                .borrowDate(r.getBorrowDate())
                .dueDate(r.getDueDate())
                .returnDate(r.getReturnDate())
                .status(r.getStatus().name())
                .build();
    }
}
