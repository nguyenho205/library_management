package com.fresher.library.service;

import com.fresher.library.dto.response.BorrowRecordResponse;
import com.fresher.library.entity.*;
import com.fresher.library.exception.BadRequestException;
import com.fresher.library.exception.ForbiddenException;
import com.fresher.library.exception.ResourceNotFoundException;
import com.fresher.library.repository.BookRepository;
import com.fresher.library.repository.BorrowRecordRepository;
import com.fresher.library.repository.MemberRepository;
import com.fresher.library.service.impl.BorrowServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Test cac rule nghiep vu quan trong nhat cua chuc nang Muon/Tra sach:
 * 1. Khong cho muon neu sach da het (quantityAvailable = 0)
 * 2. Khong cho muon neu user dang co 1 phieu muon khac chua tra (rule "1 loai sach/1 thoi diem")
 * 3. Muon thanh cong thi phai tru di 1 trong kho
 * 4. Tra sach thi phai cong lai 1 vao kho va khong cho tra 2 lan
 */
@ExtendWith(MockitoExtension.class)
class BorrowServiceImplTest {

    @Mock
    private BorrowRecordRepository borrowRecordRepository;
    @Mock
    private BookRepository bookRepository;
    @Mock
    private MemberRepository memberRepository;

    @InjectMocks
    private BorrowServiceImpl borrowService;

    private Member member;
    private Book book;

    @BeforeEach
    void setUp() {
        Account account = Account.builder().id(1L).email("user@test.com").role(Role.USER).build();
        member = Member.builder().id(10L).fullName("Nguyen Van A").account(account).build();
        book = Book.builder().id(100L).title("Clean Code").quantityTotal(5).quantityAvailable(2).version(0L).build();
    }

    @Test
    void borrowBook_thanhCong_phaiTruTonKho() {
        when(memberRepository.findByAccount_Email("user@test.com")).thenReturn(Optional.of(member));
        when(borrowRecordRepository.existsByMember_IdAndStatus(10L, BorrowStatus.BORROWED)).thenReturn(false);
        when(bookRepository.findById(100L)).thenReturn(Optional.of(book));
        when(bookRepository.save(any(Book.class))).thenAnswer(inv -> inv.getArgument(0));
        when(borrowRecordRepository.save(any(BorrowRecord.class))).thenAnswer(inv -> {
            BorrowRecord r = inv.getArgument(0);
            r.setId(999L);
            return r;
        });

        BorrowRecordResponse response = borrowService.borrowBook("user@test.com", 100L);

        assertThat(response.getBookId()).isEqualTo(100L);
        assertThat(response.getStatus()).isEqualTo("BORROWED");
        assertThat(book.getQuantityAvailable()).isEqualTo(1); // 2 -> 1 sau khi muon
        verify(bookRepository, times(1)).save(book);
    }

    @Test
    void borrowBook_hetHang_phaiNemBadRequestException() {
        book.setQuantityAvailable(0);
        when(memberRepository.findByAccount_Email("user@test.com")).thenReturn(Optional.of(member));
        when(borrowRecordRepository.existsByMember_IdAndStatus(10L, BorrowStatus.BORROWED)).thenReturn(false);
        when(bookRepository.findById(100L)).thenReturn(Optional.of(book));

        assertThatThrownBy(() -> borrowService.borrowBook("user@test.com", 100L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("het");

        verify(bookRepository, never()).save(any());
    }

    @Test
    void borrowBook_dangMuonSachKhac_phaiNemBadRequestException() {
        when(memberRepository.findByAccount_Email("user@test.com")).thenReturn(Optional.of(member));
        when(borrowRecordRepository.existsByMember_IdAndStatus(10L, BorrowStatus.BORROWED)).thenReturn(true);

        assertThatThrownBy(() -> borrowService.borrowBook("user@test.com", 100L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("dang muon");

        verifyNoInteractions(bookRepository);
    }

    @Test
    void borrowBook_sachKhongTonTai_phaiNemResourceNotFoundException() {
        when(memberRepository.findByAccount_Email("user@test.com")).thenReturn(Optional.of(member));
        when(borrowRecordRepository.existsByMember_IdAndStatus(10L, BorrowStatus.BORROWED)).thenReturn(false);
        when(bookRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> borrowService.borrowBook("user@test.com", 999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void returnBook_thanhCong_phaiCongLaiTonKho() {
        BorrowRecord record = BorrowRecord.builder()
                .id(500L).member(member).book(book).status(BorrowStatus.BORROWED).build();
        when(memberRepository.findByAccount_Email("user@test.com")).thenReturn(Optional.of(member));
        when(borrowRecordRepository.findById(500L)).thenReturn(Optional.of(record));
        when(borrowRecordRepository.save(any(BorrowRecord.class))).thenAnswer(inv -> inv.getArgument(0));
        when(bookRepository.save(any(Book.class))).thenAnswer(inv -> inv.getArgument(0));

        BorrowRecordResponse response = borrowService.returnBook("user@test.com", 500L);

        assertThat(response.getStatus()).isEqualTo("RETURNED");
        assertThat(book.getQuantityAvailable()).isEqualTo(3); // 2 -> 3 sau khi tra
    }

    @Test
    void returnBook_khongPhaiChuSoHuu_phaiNemForbiddenException() {
        Account otherAccount = Account.builder().id(2L).email("other@test.com").role(Role.USER).build();
        Member otherMember = Member.builder().id(20L).fullName("Nguoi Khac").account(otherAccount).build();
        BorrowRecord record = BorrowRecord.builder()
                .id(500L).member(otherMember).book(book).status(BorrowStatus.BORROWED).build();

        when(memberRepository.findByAccount_Email("user@test.com")).thenReturn(Optional.of(member));
        when(borrowRecordRepository.findById(500L)).thenReturn(Optional.of(record));

        assertThatThrownBy(() -> borrowService.returnBook("user@test.com", 500L))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void returnBook_daTraTruocDo_phaiNemBadRequestException() {
        BorrowRecord record = BorrowRecord.builder()
                .id(500L).member(member).book(book).status(BorrowStatus.RETURNED).build();
        when(memberRepository.findByAccount_Email("user@test.com")).thenReturn(Optional.of(member));
        when(borrowRecordRepository.findById(500L)).thenReturn(Optional.of(record));

        assertThatThrownBy(() -> borrowService.returnBook("user@test.com", 500L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("da duoc tra");
    }
}
