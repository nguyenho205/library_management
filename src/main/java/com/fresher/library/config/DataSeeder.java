package com.fresher.library.config;

import com.fresher.library.entity.*;
import com.fresher.library.repository.AccountRepository;
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

        // 4. Sua du lieu tai khoan cu: moi account co mot nhom; USER khong the giu nhom ADMIN.
        accountRepository.findAll().stream()
                .filter(a -> !a.getId().equals(admin.getId()))
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

        log.info("Seed phan quyen xong: {} quyen, admin={}", perms.size(), adminEmail);
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
