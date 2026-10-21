package com.fresher.library.service;

import com.fresher.library.dto.response.BorrowRecordResponse;

import java.util.List;

public interface BorrowService {
    /** Member (theo email dang nhap) muon 1 cuon sach */
    BorrowRecordResponse borrowBook(String email, Long bookId);

    /** Member tra 1 cuon sach dang muon (theo borrowRecordId) */
    BorrowRecordResponse returnBook(String email, Long borrowRecordId);

    /** Lich su muon sach cua chinh member dang dang nhap */
    List<BorrowRecordResponse> getMyBorrowHistory(String email);
}
