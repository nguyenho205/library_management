package com.fresher.library.service;

import com.fresher.library.dto.request.MemberUpdateRequest;
import com.fresher.library.dto.request.RegisterRequest;
import com.fresher.library.dto.response.MemberResponse;
import com.fresher.library.dto.response.PageResponse;

import java.time.LocalDate;

public interface MemberService {
    PageResponse<MemberResponse> search(String fullName, String email, String bookTitle, Long bookId,
                                         LocalDate dobFrom, LocalDate dobTo, Boolean enabled, int page, int size);
    MemberResponse getById(Long id);
    MemberResponse getByEmail(String email);
    MemberResponse create(RegisterRequest request);
    MemberResponse update(Long id, MemberUpdateRequest request);
    MemberResponse lock(Long id);
    MemberResponse unlock(Long id);
    void delete(Long id);
}
