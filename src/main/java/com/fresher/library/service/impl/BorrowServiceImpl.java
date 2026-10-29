package com.fresher.library.service.impl;

import com.fresher.library.dto.request.ReturnBookRequest;
import com.fresher.library.dto.response.BorrowRecordResponse;
import com.fresher.library.entity.Account;
import com.fresher.library.entity.Book;
import com.fresher.library.entity.BookCondition;
import com.fresher.library.entity.BookStatus;
import com.fresher.library.entity.BorrowRecord;
import com.fresher.library.entity.BorrowStatus;
import com.fresher.library.entity.Member;
import com.fresher.library.entity.Role;
import com.fresher.library.exception.BadRequestException;
import com.fresher.library.exception.ForbiddenException;
import com.fresher.library.exception.ResourceNotFoundException;
import com.fresher.library.repository.AccountRepository;
import com.fresher.library.repository.BookRepository;
import com.fresher.library.repository.BorrowRecordRepository;
import com.fresher.library.repository.MemberRepository;
import com.fresher.library.service.BorrowService;
import com.fresher.library.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Nghiep vu muon/tra sach voi quy trinh phe duyet:
 * 1. Doc gia gui yeu cau muon sach (kem ngay hen tra tuy chon) -> trang thai PENDING (kho chua tru).
 * 2. Thu thu / Admin xem xet phe duyet -> trang thai BORROWED, tru 1 sach trong kho.
 *    Neu tu choi -> trang thai REJECTED, ton kho khong doi.
 * 3. Tinh toan qua han va phat tre han (5.000 VND / ngay) thong nhat tap trung.
 * 4. Tra sach (doc gia hoac thu thu xac nhan) -> trang thai RETURNED, cong 1 sach vao kho.
 */
@Service
@RequiredArgsConstructor
@Log4j2
public class BorrowServiceImpl implements BorrowService {

    public static final int DEFAULT_LOAN_PERIOD_DAYS = 10;
    public static final int MAX_LOAN_PERIOD_DAYS = 10;
    public static final int MAX_ACTIVE_BORROW_LIMIT = 2;
    public static final BigDecimal DEFAULT_PENALTY_RATE_PER_DAY = new BigDecimal("5000");
    public static final BigDecimal SERVICE_FEE = new BigDecimal("20000");
    public static final BigDecimal LOST_PROCESSING_FEE = new BigDecimal("50000");

    private final BorrowRecordRepository borrowRecordRepository;
    private final BookRepository bookRepository;
    private final MemberRepository memberRepository;
    private final AccountRepository accountRepository;
    private final EmailService emailService;

    @Override
    @Transactional
    public BorrowRecordResponse requestBorrow(String email, Long bookId, LocalDate requestedDueDate) {
        Member member = memberRepository.findByAccount_EmailWithLock(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ thành viên cho tài khoản: " + email));

        // Quy định: Số lượng mượn tối đa 2 cuốn / 1 lần mượn (đang mượn + đang chờ duyệt)
        long activeOrPendingCount = borrowRecordRepository.countByMember_IdAndStatusIn(
                member.getId(), List.of(BorrowStatus.BORROWED, BorrowStatus.PENDING));
        if (activeOrPendingCount >= MAX_ACTIVE_BORROW_LIMIT) {
            throw new BadRequestException("Theo quy định của thư viện, mỗi độc giả được mượn tối đa " + MAX_ACTIVE_BORROW_LIMIT
                    + " cuốn / 1 lần mượn. Hiện bạn đã có " + activeOrPendingCount
                    + " cuốn đang mượn hoặc chờ duyệt. Vui lòng hoàn tất hoặc trả bớt sách trước khi mượn tiếp.");
        }

        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách với mã ID=" + bookId));

        // Kiểm tra độc giả đã mượn hoặc đang chờ duyệt cuốn này chưa
        boolean alreadyBorrowingSameBook = borrowRecordRepository.existsByMember_IdAndBook_IdAndStatusIn(
                member.getId(), bookId, List.of(BorrowStatus.BORROWED, BorrowStatus.PENDING));
        if (alreadyBorrowingSameBook) {
            throw new BadRequestException("Bạn đang mượn hoặc đang có yêu cầu chờ duyệt cuốn sách \"" + book.getTitle() + "\" này rồi.");
        }

        if (book.getStatus() == BookStatus.DISCONTINUED) {
            throw new BadRequestException("Sách \"" + book.getTitle() + "\" đã ngừng lưu hành, không thể yêu cầu mượn.");
        }

        if (book.getQuantityAvailable() <= 0) {
            throw new BadRequestException("Sách \"" + book.getTitle() + "\" hiện đã hết, không còn để mượn.");
        }

        LocalDate today = LocalDate.now();
        LocalDate finalDueDate = requestedDueDate;
        if (finalDueDate == null) {
            finalDueDate = today.plusDays(DEFAULT_LOAN_PERIOD_DAYS);
        } else {
            // Kiểm tra ngày hẹn trả độc lập tại backend: tối đa 10 ngày
            if (finalDueDate.isBefore(today.plusDays(1))) {
                throw new BadRequestException("Ngày trả dự kiến phải từ ngày mai (" + today.plusDays(1) + ") trở đi.");
            }
            if (finalDueDate.isAfter(today.plusDays(MAX_LOAN_PERIOD_DAYS))) {
                throw new BadRequestException("Thời hạn mượn theo quy định tối đa là " + MAX_LOAN_PERIOD_DAYS + " ngày (đến ngày " + today.plusDays(MAX_LOAN_PERIOD_DAYS) + ").");
            }
        }

        BorrowRecord record = BorrowRecord.builder()
                .member(member)
                .book(book)
                .borrowDate(today)
                .dueDate(finalDueDate)
                .status(BorrowStatus.PENDING)
                .build();
        record = borrowRecordRepository.save(record);

        log.info("Member id={} gui yeu cau muon sach id={} ({}) voi han tra {}",
                member.getId(), book.getId(), book.getTitle(), finalDueDate);
        return toResponse(record);
    }

    @Override
    @Transactional
    public BorrowRecordResponse approveRequest(Long borrowRecordId) {
        BorrowRecord record = borrowRecordRepository.findById(borrowRecordId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu mượn với mã ID=" + borrowRecordId));

        if (record.getStatus() != BorrowStatus.PENDING) {
            throw new BadRequestException("Chỉ có thể phê duyệt yêu cầu đang ở trạng thái chờ duyệt (PENDING). Trạng thái hiện tại: " + record.getStatus());
        }

        Book book = record.getBook();
        if (book.getStatus() == BookStatus.DISCONTINUED) {
            throw new BadRequestException("Sách \"" + book.getTitle() + "\" đã ngừng lưu hành, không thể duyệt.");
        }

        if (book.getQuantityAvailable() <= 0) {
            throw new BadRequestException("Sách \"" + book.getTitle() + "\" hiện đã hết trong kho, không thể duyệt.");
        }

        book.setQuantityAvailable(book.getQuantityAvailable() - 1);
        bookRepository.save(book);

        LocalDate today = LocalDate.now();
        record.setStatus(BorrowStatus.BORROWED);
        record.setBorrowDate(today);

        // Quy định: Thời hạn mượn 10 ngày kể từ ngày nhận tài liệu (ngày phê duyệt)
        record.setDueDate(today.plusDays(DEFAULT_LOAN_PERIOD_DAYS));

        record = borrowRecordRepository.save(record);
        log.info("Admin da duyet yeu cau mượn id={}, con lai {} cuon sach", record.getId(), book.getQuantityAvailable());
        return toResponse(record);
    }

    @Override
    @Transactional
    public BorrowRecordResponse rejectRequest(Long borrowRecordId) {
        BorrowRecord record = borrowRecordRepository.findById(borrowRecordId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu mượn với mã ID=" + borrowRecordId));

        if (record.getStatus() != BorrowStatus.PENDING) {
            throw new BadRequestException("Chỉ có thể từ chối yêu cầu đang ở trạng thái chờ duyệt (PENDING). Trạng thái hiện tại: " + record.getStatus());
        }

        record.setStatus(BorrowStatus.REJECTED);
        record = borrowRecordRepository.save(record);
        log.info("Admin da tu choi yeu cau muon id={}", record.getId());
        return toResponse(record);
    }

    @Override
    @Transactional
    public BorrowRecordResponse cancelRequest(String email, Long borrowRecordId) {
        Member member = getMemberByEmail(email);
        BorrowRecord record = borrowRecordRepository.findById(borrowRecordId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu mượn với mã ID=" + borrowRecordId));

        if (!record.getMember().getId().equals(member.getId())) {
            throw new ForbiddenException("Bạn không có quyền huỷ yêu cầu của độc giả khác.");
        }

        if (record.getStatus() != BorrowStatus.PENDING) {
            throw new BadRequestException("Chỉ có thể huỷ yêu cầu đang ở trạng thái chờ duyệt.");
        }

        record.setStatus(BorrowStatus.REJECTED);
        record = borrowRecordRepository.save(record);
        log.info("Member id={} da tu huy yeu cau muon id={}", member.getId(), record.getId());
        return toResponse(record);
    }

    @Override
    @Transactional
    public BorrowRecordResponse borrowBook(String email, Long bookId) {
        // Cho phep muon truc tiep (tuong thich nguoc / test): gui yeu cau va duyet luon neu hop le
        BorrowRecordResponse requested = requestBorrow(email, bookId, null);
        return approveRequest(requested.getId());
    }

    @Override
    @Transactional
    public BorrowRecordResponse returnBook(String actorEmail, Long borrowRecordId) {
        return returnBook(actorEmail, borrowRecordId, null);
    }

    @Override
    @Transactional
    public BorrowRecordResponse returnBook(String actorEmail, Long borrowRecordId, ReturnBookRequest request) {
        BorrowRecord record = borrowRecordRepository.findById(borrowRecordId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu mượn với mã ID=" + borrowRecordId));

        Account actor = accountRepository.findByEmail(actorEmail).orElse(null);
        boolean isStaffOrAdmin = actor != null && (actor.getRole() == Role.ADMIN
                || (actor.getPermissionGroup() != null && actor.getPermissionGroup().getPermissions().stream()
                .anyMatch(p -> "BOOK_UPDATE".equals(p.getCode()) || "BOOK_CREATE".equals(p.getCode()) || "BORROW_USE".equals(p.getCode()))));

        // Theo quy dinh: Thu thu phai la nguoi kiem tra tinh trang sach va duyet nhan lai
        if (!isStaffOrAdmin) {
            throw new ForbiddenException("Chỉ thủ thư hoặc ban quản trị mới có quyền kiểm tra tình trạng sách và xác nhận duyệt hoàn trả.");
        }

        if (record.getStatus() == BorrowStatus.RETURNED) {
            throw new BadRequestException("Phiếu mượn này đã được hoàn trả trước đó.");
        }
        if (record.getStatus() != BorrowStatus.BORROWED) {
            throw new BadRequestException("Chỉ có thể hoàn trả phiếu mượn đang trong trạng thái mượn (BORROWED).");
        }

        BookCondition condition = (request != null && request.getCondition() != null)
                ? request.getCondition()
                : BookCondition.INTACT;
        BigDecimal damageFee = (request != null && request.getDamageFee() != null)
                ? request.getDamageFee()
                : BigDecimal.ZERO;
        String notes = (request != null) ? request.getNotes() : null;

        LocalDate returnDate = LocalDate.now();
        record.setReturnDate(returnDate);
        record.setStatus(BorrowStatus.RETURNED);
        record.setBookCondition(condition);
        record.setDamageFee(damageFee);
        record.setReturnNotes(notes);
        record.setReturnedBy(actorEmail);
        borrowRecordRepository.save(record);

        // Chi tang so luong sach kha dung neu sach con nguyen ven hoac hu hong nhe co the phuc hoi
        // Neu sach hu hong nang hoac mat sach thi khong tang lai so luong sach kha dung
        Book book = record.getBook();
        if (condition == BookCondition.INTACT || condition == BookCondition.LIGHT_DAMAGE) {
            book.setQuantityAvailable(book.getQuantityAvailable() + 1);
            bookRepository.save(book);
        }

        log.info("Thu thu {} da kiem tra tinh trang {} va duyet tra sach id={} (record id={})",
                actorEmail, condition, book.getId(), record.getId());
        return toResponse(record);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BorrowRecordResponse> getMyBorrowHistory(String email) {
        return memberRepository.findByAccount_Email(email)
                .map(m -> borrowRecordRepository.findByMemberIdWithDetails(m.getId()).stream()
                        .map(this::toResponse)
                        .collect(Collectors.toList()))
                .orElse(java.util.Collections.emptyList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BorrowRecordResponse> getAllCirculationRecords(BorrowStatus status) {
        List<BorrowRecord> records;
        if (status != null) {
            records = borrowRecordRepository.findByStatusWithDetails(status);
        } else {
            records = borrowRecordRepository.findAllWithDetails();
        }
        return records.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public static long calculateOverdueDays(LocalDate dueDate, LocalDate returnDate, BorrowStatus status) {
        if (dueDate == null) return 0;
        LocalDate referenceDate;
        if (status == BorrowStatus.RETURNED && returnDate != null) {
            referenceDate = returnDate;
        } else if (status == BorrowStatus.BORROWED) {
            referenceDate = LocalDate.now();
        } else {
            return 0;
        }

        if (referenceDate.isAfter(dueDate)) {
            return ChronoUnit.DAYS.between(dueDate, referenceDate);
        }
        return 0;
    }

    public static BigDecimal calculatePenalty(long overdueDays, BigDecimal ratePerDay) {
        if (overdueDays <= 0) return BigDecimal.ZERO;
        return ratePerDay.multiply(BigDecimal.valueOf(overdueDays));
    }

    private Member getMemberByEmail(String email) {
        return memberRepository.findByAccount_Email(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ thành viên cho tài khoản: " + email));
    }

    private BorrowRecordResponse toResponse(BorrowRecord r) {
        long overdueDays = calculateOverdueDays(r.getDueDate(), r.getReturnDate(), r.getStatus());
        boolean isOverdue = overdueDays > 0;
        BigDecimal penalty = calculatePenalty(overdueDays, DEFAULT_PENALTY_RATE_PER_DAY);
        BigDecimal damageFee = r.getDamageFee() != null ? r.getDamageFee() : BigDecimal.ZERO;
        BigDecimal totalFine = penalty.add(damageFee);

        Long bookId = null;
        String bookTitle = "Tác phẩm";
        String bookImgUrl = null;
        try {
            if (r.getBook() != null) {
                bookId = r.getBook().getId();
                bookTitle = r.getBook().getTitle();
                bookImgUrl = r.getBook().getImgUrl();
            }
        } catch (Exception e) {
            log.warn("Không thể tải thông tin Book của record id={}: {}", r.getId(), e.getMessage());
        }

        Long memberId = null;
        String memberName = "Độc giả";
        String email = null;
        try {
            if (r.getMember() != null) {
                memberId = r.getMember().getId();
                memberName = r.getMember().getFullName();
                if (r.getMember().getAccount() != null) {
                    email = r.getMember().getAccount().getEmail();
                }
            }
        } catch (Exception e) {
            log.warn("Không thể tải thông tin Member/Account của record id={}: {}", r.getId(), e.getMessage());
        }

        return BorrowRecordResponse.builder()
                .id(r.getId())
                .bookId(bookId)
                .bookTitle(bookTitle)
                .bookImgUrl(bookImgUrl)
                .memberId(memberId)
                .memberName(memberName)
                .memberEmail(email)
                .borrowDate(r.getBorrowDate())
                .dueDate(r.getDueDate())
                .returnDate(r.getReturnDate())
                .status(r.getStatus() != null ? r.getStatus().name() : "BORROWED")
                .overdue(isOverdue)
                .overdueDays(overdueDays)
                .penaltyAmount(penalty)
                .penaltyRatePerDay(DEFAULT_PENALTY_RATE_PER_DAY)
                .bookCondition(r.getBookCondition() != null ? r.getBookCondition().name() : null)
                .damageFee(damageFee)
                .returnNotes(r.getReturnNotes())
                .returnedBy(r.getReturnedBy())
                .totalFineAmount(totalFine)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public BorrowRecordResponse sendDueReminder(Long borrowRecordId) {
        BorrowRecord record = borrowRecordRepository.findById(borrowRecordId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu mượn với mã ID=" + borrowRecordId));

        if (record.getStatus() != BorrowStatus.BORROWED) {
            throw new BadRequestException("Chỉ có thể gửi email nhắc nhở cho sách đang mượn (BORROWED).");
        }

        Member member = record.getMember();
        if (member == null || member.getAccount() == null || member.getAccount().getEmail() == null) {
            throw new BadRequestException("Không tìm thấy thông tin email độc giả của phiếu mượn này.");
        }

        String recipientEmail = member.getAccount().getEmail();
        String memberName = member.getFullName();
        String bookTitle = record.getBook() != null ? record.getBook().getTitle() : "Tác phẩm thư viện";
        LocalDate today = LocalDate.now();
        LocalDate dueDate = record.getDueDate();

        boolean isOverdue = dueDate != null && dueDate.isBefore(today);
        long days;
        if (isOverdue) {
            days = ChronoUnit.DAYS.between(dueDate, today);
        } else if (dueDate != null) {
            days = ChronoUnit.DAYS.between(today, dueDate);
        } else {
            days = 0;
        }

        emailService.sendDueReminderEmail(recipientEmail, memberName, bookTitle, dueDate, days, isOverdue);
        log.info("Đã gửi email nhắc nhở hạn trả sách recordId={} tới email={}", record.getId(), recipientEmail);
        return toResponse(record);
    }

    @Override
    @Transactional(readOnly = true)
    public int sendDueRemindersBatch() {
        List<BorrowRecord> activeRecords = borrowRecordRepository.findByStatusWithDetails(BorrowStatus.BORROWED);
        LocalDate today = LocalDate.now();
        int sentCount = 0;

        for (BorrowRecord r : activeRecords) {
            LocalDate due = r.getDueDate();
            if (due == null) continue;

            boolean isOverdue = due.isBefore(today);
            boolean isDueToday = due.isEqual(today);
            boolean isDueSoon = due.isEqual(today.plusDays(1)) || due.isEqual(today.plusDays(2));

            if (isOverdue || isDueToday || isDueSoon) {
                try {
                    String email = (r.getMember() != null && r.getMember().getAccount() != null)
                            ? r.getMember().getAccount().getEmail()
                            : null;
                    if (email != null && !email.isBlank()) {
                        long days = isOverdue
                                ? ChronoUnit.DAYS.between(due, today)
                                : ChronoUnit.DAYS.between(today, due);
                        String memberName = r.getMember().getFullName();
                        String title = r.getBook() != null ? r.getBook().getTitle() : "Tài liệu";

                        emailService.sendDueReminderEmail(email, memberName, title, due, days, isOverdue);
                        sentCount++;
                    }
                } catch (Exception e) {
                    log.error("Lỗi khi gửi email nhắc nhở hạn trả cho record id={}: {}", r.getId(), e.getMessage());
                }
            }
        }

        log.info("Hoàn tất quét gửi mail nhắc nhở hạn trả sách: đã gửi {} email", sentCount);
        return sentCount;
    }
}
