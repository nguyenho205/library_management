package com.fresher.library.service;

import com.fresher.library.dto.response.BorrowRecordResponse;
import com.fresher.library.entity.BorrowStatus;

import java.time.LocalDate;
import java.util.List;

public interface BorrowService {
    /** Member gui yeu cau muon sach voi ngay tra do minh lua chon */
    BorrowRecordResponse requestBorrow(String email, Long bookId, LocalDate requestedDueDate);

    /** Thu vien / Admin phe duyet yeu cau muon */
    BorrowRecordResponse approveRequest(Long borrowRecordId);

    /** Thu vien / Admin tu choi yeu cau muon */
    BorrowRecordResponse rejectRequest(Long borrowRecordId);

    /** Member huy yeu cau muon cua chinh minh khi con PENDING */
    BorrowRecordResponse cancelRequest(String email, Long borrowRecordId);

    /** Muon sach truc tiep (tuong thich nguoc) */
    BorrowRecordResponse borrowBook(String email, Long bookId);

    /** Tra sach (boi doc gia hoac admin) */
    BorrowRecordResponse returnBook(String actorEmail, Long borrowRecordId);

    /** Thu thu kiem tra tinh trang sach va xac nhan duyet hoan tra */
    BorrowRecordResponse returnBook(String actorEmail, Long borrowRecordId, com.fresher.library.dto.request.ReturnBookRequest request);

    /** Lich su muon sach cua member dang dang nhap */
    List<BorrowRecordResponse> getMyBorrowHistory(String email);

    /** Lay toan bo ho so luu thong mien hoac loc theo trang thai cho Admin */
    List<BorrowRecordResponse> getAllCirculationRecords(BorrowStatus status);

    /** Gui email nhac nho han tra sach cho 1 phieu muon cu the */
    BorrowRecordResponse sendDueReminder(Long borrowRecordId);

    /** Quet toan bo sach dang muon de gui email nhac nho toi han / qua han */
    int sendDueRemindersBatch();
}
