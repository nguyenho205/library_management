package com.fresher.library.service.impl;

import com.fresher.library.config.DataSeeder;
import com.fresher.library.dto.request.MemberUpdateRequest;
import com.fresher.library.dto.request.RegisterRequest;
import com.fresher.library.dto.response.MemberResponse;
import com.fresher.library.dto.response.PageResponse;
import com.fresher.library.entity.Account;
import com.fresher.library.entity.Member;
import com.fresher.library.entity.PermissionGroup;
import com.fresher.library.entity.Role;
import com.fresher.library.exception.BadRequestException;
import com.fresher.library.exception.ResourceNotFoundException;
import com.fresher.library.entity.BorrowStatus;
import com.fresher.library.repository.AccountRepository;
import com.fresher.library.repository.BorrowRecordRepository;
import com.fresher.library.repository.MemberRepository;
import com.fresher.library.repository.PermissionGroupRepository;
import com.fresher.library.repository.VerificationTokenRepository;
import com.fresher.library.repository.specification.MemberSpecification;
import com.fresher.library.service.MemberService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * Man hinh quan ly Member (chi ADMIN duoc goi - xem SecurityConfig):
 * - Tim kiem tren nhieu tieu chi (ten, email, sach da muon, khoang ngay sinh) - MemberSpecification
 * - Tao moi member, cap nhat thong tin member
 */
@Service
@RequiredArgsConstructor
@Log4j2
public class MemberServiceImpl implements MemberService {

    private static final int MAX_PAGE_SIZE = 10;

    private final MemberRepository memberRepository;
    private final AccountRepository accountRepository;
    private final BorrowRecordRepository borrowRecordRepository;
    private final VerificationTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final PermissionGroupRepository permissionGroupRepository;

    @Override
    public PageResponse<MemberResponse> search(String fullName, String email, String bookTitle, Long bookId,
                                                LocalDate dobFrom, LocalDate dobTo, Boolean enabled, int page, int size) {
        // Validate khoang ngay: tu phai <= den (yeu cau de bai: "Check validation khi nhap ngay khong dung")
        if (dobFrom != null && dobTo != null && dobFrom.isAfter(dobTo)) {
            throw new BadRequestException("Ngày bắt đầu (dobFrom) phải trước hoặc bằng ngày kết thúc (dobTo)");
        }

        int safeSize = Math.min(size <= 0 ? MAX_PAGE_SIZE : size, MAX_PAGE_SIZE);
        PageRequest pageRequest = PageRequest.of(Math.max(page, 0), safeSize, Sort.by("id").descending());

        Page<Member> result = memberRepository.findAll(
                MemberSpecification.withFilters(fullName, email, bookTitle, bookId, dobFrom, dobTo, enabled), pageRequest);

        return PageResponse.from(result.map(this::toResponse));
    }

    @Override
    public MemberResponse getById(Long id) {
        return toResponse(findMemberOrThrow(id));
    }

    @Override
    public MemberResponse getByEmail(String email) {
        Member member = memberRepository.findByAccount_Email(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ thành viên cho email: " + email));
        return toResponse(member);
    }

    @Override
    @Transactional
    public MemberResponse create(RegisterRequest request) {
        // Admin tao truc tiep member moi: khong can qua buoc xac thuc email (khac voi tu dang ky)
        if (accountRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email này đã được sử dụng");
        }
        Account account = Account.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .enabled(true)
                .emailVerified(true) // admin tao truc tiep nen coi nhu da xac thuc
                .permissionGroup(defaultGroup())
                .build();
        account = accountRepository.save(account);

        Member member = Member.builder()
                .fullName(request.getFullName())
                .account(account)
                .build();
        member = memberRepository.save(member);
        log.info("Admin tao member moi: id={}, email={}", member.getId(), account.getEmail());
        return toResponse(member);
    }

    @Override
    @Transactional
    public MemberResponse update(Long id, MemberUpdateRequest request) {
        Member member = findMemberOrThrow(id);
        member.setFullName(request.getFullName());
        member.setDateOfBirth(request.getDateOfBirth());
        member.setPhone(request.getPhone());
        member.setAddress(request.getAddress());
        member = memberRepository.save(member);
        log.info("Cap nhat thong tin member: id={}", id);
        return toResponse(member);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Member member = findMemberOrThrow(id);

        if (borrowRecordRepository.existsByMember_IdAndStatus(member.getId(), BorrowStatus.BORROWED)) {
            throw new BadRequestException("Thành viên đang mượn sách chưa trả. Vui lòng thu hồi sách trước khi xoá tài khoản.");
        }

        Account account = member.getAccount();
        if (account != null) {
            String currentEmail = SecurityContextHolder.getContext().getAuthentication() != null
                    ? SecurityContextHolder.getContext().getAuthentication().getName()
                    : null;
            if (account.getEmail().equalsIgnoreCase(currentEmail)) {
                throw new BadRequestException("Bạn không thể tự xoá tài khoản của chính mình.");
            }
            if (account.getRole() == Role.ADMIN) {
                throw new BadRequestException("Không thể xoá tài khoản Quản trị viên.");
            }

            tokenRepository.deleteByAccount_Id(account.getId());
        }

        memberRepository.delete(member);

        if (account != null) {
            accountRepository.delete(account);
        }
        log.info("Xoa member va account thanh cong: member_id={}, email={}", id, account != null ? account.getEmail() : "null");
    }

    @Override
    @Transactional
    public MemberResponse lock(Long id) {
        Member member = findMemberOrThrow(id);
        Account account = member.getAccount();
        if (account == null) {
            throw new BadRequestException("Hồ sơ thành viên không liên kết với tài khoản nào");
        }
        String currentEmail = SecurityContextHolder.getContext().getAuthentication() != null
                ? SecurityContextHolder.getContext().getAuthentication().getName()
                : null;
        if (account.getEmail().equalsIgnoreCase(currentEmail)) {
            throw new BadRequestException("Bạn không thể tự khoá tài khoản của chính mình");
        }
        if (account.getRole() == Role.ADMIN) {
            throw new BadRequestException("Không thể khoá tài khoản Quản trị viên");
        }
        account.setEnabled(false);
        accountRepository.save(account);
        log.info("Khoa tai khoan thanh vien: id={}, email={}", id, account.getEmail());
        return toResponse(member);
    }

    @Override
    @Transactional
    public MemberResponse unlock(Long id) {
        Member member = findMemberOrThrow(id);
        Account account = member.getAccount();
        if (account == null) {
            throw new BadRequestException("Hồ sơ thành viên không liên kết với tài khoản nào");
        }
        account.setEnabled(true);
        accountRepository.save(account);
        log.info("Mo khoa tai khoan thanh vien: id={}, email={}", id, account.getEmail());
        return toResponse(member);
    }

    private Member findMemberOrThrow(Long id) {
        return memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thành viên với id=" + id));
    }

    private MemberResponse toResponse(Member member) {
        return MemberResponse.builder()
                .id(member.getId())
                .fullName(member.getFullName())
                .email(member.getAccount() != null ? member.getAccount().getEmail() : null)
                .dateOfBirth(member.getDateOfBirth())
                .phone(member.getPhone())
                .address(member.getAddress())
                .emailVerified(member.getAccount() != null && member.getAccount().isEmailVerified())
                .enabled(member.getAccount() == null || member.getAccount().isEnabled())
                .build();
    }

    private PermissionGroup defaultGroup() {
        return permissionGroupRepository.findByName(DataSeeder.GROUP_BORROW)
                .orElseThrow(() -> new IllegalStateException("Default permission group is missing"));
    }
}
