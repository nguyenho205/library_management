package com.fresher.library.config;

import com.fresher.library.entity.*;
import com.fresher.library.repository.AccountRepository;
import com.fresher.library.repository.BookRepository;
import com.fresher.library.repository.BorrowRecordRepository;
import com.fresher.library.repository.MemberRepository;
import com.fresher.library.repository.PermissionGroupRepository;
import com.fresher.library.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Khoi tao du lieu mac dinh (idempotent, chay lai nhieu lan khong sao):
 * 1. Cac quyen nho (Permission)
 * 2. Cac nhom quyen mau (PermissionGroup)
 * 3. Tai khoan ADMIN mac dinh + gan nhom toan quyen
 * 4. Dam bao moi tai khoan co mot nhom; USER khong giu nhom/toan quyen quan tri
 */
@Component
@RequiredArgsConstructor
@Log4j2
public class DataSeeder implements CommandLineRunner {

    public static final String GROUP_FULL = "Quản trị toàn quyền";
    public static final String GROUP_BOOK_CRUD = "CRUD sách";
    public static final String GROUP_MEMBER = "Quản lý thành viên";
    public static final String GROUP_BORROW = "Mượn trả sách";
    public static final String GROUP_CONFIG = "Cấu hình hệ thống";

    private static final String[][] PERMISSIONS = {
            {"BOOK_VIEW", "Xem và tìm kiếm sách"},
            {"BOOK_CREATE", "Thêm sách"},
            {"BOOK_UPDATE", "Sửa sách"},
            {"BOOK_DELETE", "Xoá sách"},
            {"BOOK_IMPORT", "Nhập sách từ CSV"},
            {"MEMBER_VIEW", "Xem và tìm kiếm thành viên"},
            {"MEMBER_CREATE", "Tạo thành viên"},
            {"MEMBER_UPDATE", "Sửa thành viên"},
            {"MEMBER_DELETE", "Xoá thành viên"},
            {"BORROW_USE", "Mượn, trả sách và xem lịch sử mượn"},
            {"CONFIG_VIEW", "Xem cấu hình hệ thống"},
            {"CONFIG_UPDATE", "Bật/tắt bảo trì hệ thống"},
            {"PERMISSION_MANAGE", "Quản lý nhóm quyền và gán quyền cho tài khoản"}
    };

    private final AccountRepository accountRepository;
    private final MemberRepository memberRepository;
    private final PermissionRepository permissionRepository;
    private final PermissionGroupRepository groupRepository;
    private final BookRepository bookRepository;
    private final BorrowRecordRepository borrowRecordRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.default-admin.email}")
    private String adminEmail;

    @Value("${app.default-admin.password}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(String... args) {
        // 1. Quyen nho
        Map<String, Permission> perms = new LinkedHashMap<>();
        for (String[] p : PERMISSIONS) {
            perms.put(p[0], permissionRepository.findByCode(p[0]).orElseGet(() ->
                    permissionRepository.save(Permission.builder().code(p[0]).description(p[1]).build())));
        }

        // 2. Nhom quyen mau (chi tao neu chua co, khong ghi de nhung gi admin da chinh sua)
        PermissionGroup full = seedGroup(GROUP_FULL, "Toàn bộ chức năng hệ thống", perms.values());
        full.getPermissions().addAll(perms.values()); // nhom toan quyen luon dong bo quyen moi
        full = groupRepository.save(full);

        seedGroup(GROUP_BOOK_CRUD, "Thêm, sửa, xoá, nhập CSV và xem sách",
                pick(perms, "BOOK_VIEW", "BOOK_CREATE", "BOOK_UPDATE", "BOOK_DELETE", "BOOK_IMPORT"));
        seedGroup(GROUP_MEMBER, "Quản lý thành viên thư viện",
                pick(perms, "MEMBER_VIEW", "MEMBER_CREATE", "MEMBER_UPDATE", "MEMBER_DELETE"));
        seedGroup(GROUP_CONFIG, "Xem và bật/tắt chế độ bảo trì",
                pick(perms, "CONFIG_VIEW", "CONFIG_UPDATE"));
        PermissionGroup borrowGroup = seedGroup(GROUP_BORROW, "Tra cứu sách, mượn và trả sách",
                pick(perms, "BOOK_VIEW", "BORROW_USE"));

        // PERMISSION_MANAGE chi duoc nam trong nhom he thong danh rieng cho ADMIN.
        groupRepository.findAll().stream()
                .filter(group -> !GROUP_FULL.equals(group.getName()))
                .forEach(group -> {
                    boolean changed = group.getPermissions().removeIf(p -> "PERMISSION_MANAGE".equals(p.getCode()));
                    if (changed) groupRepository.save(group);
                });

        // 3. Admin mac dinh + nhom toan quyen
        PermissionGroup adminGroup = full;
        Account admin = accountRepository.findByEmail(adminEmail).orElseGet(() ->
                accountRepository.save(Account.builder()
                        .email(adminEmail)
                        .password(passwordEncoder.encode(adminPassword))
                        .role(Role.ADMIN)
                        .enabled(true)
                        .emailVerified(true)
                        .permissionGroup(adminGroup)
                        .build()));
        admin.setRole(Role.ADMIN);
        admin.setPermissionGroup(adminGroup);
        admin = accountRepository.save(admin);

        if (memberRepository.findByAccount_Id(admin.getId()).isEmpty()) {
            memberRepository.save(Member.builder()
                    .fullName("Quản trị viên Hệ thống")
                    .account(admin)
                    .build());
        }

        final Long adminId = admin.getId();

        // 4. Sua du lieu tai khoan cu: moi account co mot nhom; USER khong the giu nhom ADMIN.
        accountRepository.findAll().stream()
                .filter(a -> !a.getId().equals(adminId))
                .forEach(a -> {
                    boolean changed = false;
                    if (a.getRole() == Role.USER && (a.getPermissionGroup() == null
                            || GROUP_FULL.equals(a.getPermissionGroup().getName())
                            || a.getPermissionGroup().getPermissions().stream()
                                    .anyMatch(p -> "PERMISSION_MANAGE".equals(p.getCode())))) {
                        a.setPermissionGroup(borrowGroup);
                        changed = true;
                    } else if (a.getRole() == Role.ADMIN && a.getPermissionGroup() == null) {
                        a.setPermissionGroup(adminGroup);
                        changed = true;
                    }
                    if (changed) accountRepository.save(a);
                });

        // 5. Seed tai khoan doc gia mau va ho so muon qua han mau (yeu cau kich ban 28/10/2026: qua han 14 ngay, phat 70.000 VND)
        seedDemoCustomerAndOverdueRecord(borrowGroup);

        log.info("Seed phan quyen xong: {} quyen, admin={}", perms.size(), adminEmail);
    }

    private void seedDemoCustomerAndOverdueRecord(PermissionGroup borrowGroup) {
        String customerEmail = "customer@library.local";
        Account customer = accountRepository.findByEmail(customerEmail).orElseGet(() ->
                accountRepository.save(Account.builder()
                        .email(customerEmail)
                        .password(passwordEncoder.encode("Customer@123"))
                        .role(Role.USER)
                        .enabled(true)
                        .emailVerified(true)
                        .permissionGroup(borrowGroup)
                        .build()));

        Member customerMember = memberRepository.findByAccount_Id(customer.getId()).orElseGet(() ->
                memberRepository.save(Member.builder()
                        .fullName("Độc giả Mẫu")
                        .account(customer)
                        .build()));

        // Neu chua co sach trong kho, khoi tao dau sach mac dinh
        if (bookRepository.count() == 0) {
            bookRepository.save(Book.builder()
                    .isbn("978-604-0-12345-1")
                    .title("Tắt đèn")
                    .description("Tác phẩm văn học hiện thực xuất sắc của nhà văn Ngô Tất Tố, phản ánh cuộc sống cơ cực của người nông dân Việt Nam trước Cách mạng.")
                    .quantityTotal(5)
                    .quantityAvailable(4)
                    .status(BookStatus.IN_CIRCULATION)
                    .imgUrl("/anhbia/tatden.jpg")
                    .build());
        }

        // Dong bo link anh bia tu file cuc bo /anhbia/... cho cac sach trong he thong
        List<Book> existingBooks = bookRepository.findAll();
        for (Book b : existingBooks) {
            String title = b.getTitle() != null ? b.getTitle().toLowerCase() : "";
            String localCover = null;
            if (title.contains("tắt đèn") || title.contains("tat den")) localCover = "/anhbia/tatden.jpg";
            else if (title.contains("số đỏ") || title.contains("so do")) localCover = "/anhbia/sodo.webp";
            else if (title.contains("truyện kiều") || title.contains("truyen kieu")) localCover = "/anhbia/truyenkieu.webp";
            else if (title.contains("nhà giả kim") || title.contains("nha gia kim")) localCover = "/anhbia/nhagiakim.jpg";
            else if (title.contains("đắc nhân tâm") || title.contains("dac nhan tam")) localCover = "/anhbia/dacnhantam.jpg";
            else if (title.contains("dế mèn") || title.contains("de men")) localCover = "/anhbia/demenphieuluuky.jpg";
            else if (title.contains("giải tích") || title.contains("giai tich") || title.contains("toán")) localCover = "/anhbia/giaitich1.jpg";
            else if (title.contains("lược sử thời gian") || title.contains("luoc su thoi gian")) localCover = "/anhbia/luocsuthoigian.webp";
            else if (title.contains("lược sử loài người") || title.contains("sapiens") || title.contains("luoc su loai nguoi")) localCover = "/anhbia/luocsuloainguoi.jpg";
            else if (title.contains("vật lý") || title.contains("vat ly")) localCover = "/anhbia/vatlydaicuong.png";
            else if (title.contains("clean architecture") || title.contains("clean code")) localCover = "/anhbia/CleanArchitecture.jpg";
            else if (title.contains("spring in action") || title.contains("spring boot in action")) localCover = "/anhbia/springbootinaction.webp";
            else if (title.contains("spring")) localCover = "/anhbia/springboot.jpg";
            else if (title.contains("cấu trúc dữ liệu") || title.contains("cau truc du lieu") || title.contains("giải thuật") || title.contains("giai thuat")) localCover = "/anhbia/cautrucdulieuvagiaithuat.jpg";
            else if (title.contains("cơ sở dữ liệu") || title.contains("co so du lieu") || title.contains("database")) localCover = "/anhbia/cosodulieuquanhe.jpg";
            else if (title.contains("mạng máy tính") || title.contains("mang may tinh") || title.contains("network")) localCover = "/anhbia/mangmaytinh.jpg";
            else if (title.contains("java")) localCover = "/anhbia/javacore.jpg";

            if (localCover != null && (b.getImgUrl() == null || b.getImgUrl().contains("unsplash") || b.getImgUrl().isBlank())) {
                b.setImgUrl(localCover);
                bookRepository.save(b);
                log.info("Cap nhat anh bia local cho sach: id={}, title={}, imgUrl={}", b.getId(), b.getTitle(), localCover);
            }
        }

        // Kiem tra ban ghi muon sach qua han mau theo dung yeu cau:
        // Due date: 14 October 2026. Reference date: 28 October 2026.
        // Overdue duration: 14 days. Rate: 5,000 VND/day -> 70,000 VND.
        boolean hasOverdue = borrowRecordRepository.findByMember_IdAndStatus(customerMember.getId(), BorrowStatus.BORROWED)
                .stream()
                .anyMatch(r -> java.time.LocalDate.of(2026, 10, 14).equals(r.getDueDate()));

        if (!hasOverdue) {
            Book book = bookRepository.findAll().stream().findFirst().orElse(null);
            if (book != null) {
                BorrowRecord overdueRecord = BorrowRecord.builder()
                        .member(customerMember)
                        .book(book)
                        .borrowDate(java.time.LocalDate.of(2026, 10, 1))
                        .dueDate(java.time.LocalDate.of(2026, 10, 14))
                        .returnDate(null)
                        .status(BorrowStatus.BORROWED)
                        .build();
                borrowRecordRepository.save(overdueRecord);
                log.info("Da khoi tao ban ghi muon qua han mau: Member={}, Book={}, DueDate=2026-10-14",
                        customerMember.getFullName(), book.getTitle());
            }
        }
    }

    private PermissionGroup seedGroup(String name, String description, Collection<Permission> permissions) {
        return groupRepository.findByName(name).orElseGet(() ->
                groupRepository.save(PermissionGroup.builder()
                        .name(name)
                        .description(description)
                        .permissions(new HashSet<>(permissions))
                        .build()));
    }

    private List<Permission> pick(Map<String, Permission> perms, String... codes) {
        List<Permission> result = new ArrayList<>();
        for (String code : codes) {
            result.add(perms.get(code));
        }
        return result;
    }
}
