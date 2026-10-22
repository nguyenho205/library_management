package com.fresher.library.service.impl;

import com.fresher.library.dto.request.AssignGroupsRequest;
import com.fresher.library.dto.request.PermissionGroupRequest;
import com.fresher.library.dto.response.AccountPermissionResponse;
import com.fresher.library.dto.response.PageResponse;
import com.fresher.library.dto.response.PermissionGroupResponse;
import com.fresher.library.dto.response.PermissionResponse;
import com.fresher.library.config.DataSeeder;
import com.fresher.library.entity.Account;
import com.fresher.library.entity.Permission;
import com.fresher.library.entity.PermissionGroup;
import com.fresher.library.exception.BadRequestException;
import com.fresher.library.exception.ResourceNotFoundException;
import com.fresher.library.repository.AccountRepository;
import com.fresher.library.repository.PermissionGroupRepository;
import com.fresher.library.repository.PermissionRepository;
import com.fresher.library.service.PermissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Phan quyen dong theo nhom chuc nang:
 * - Quan ly nhom quyen (CRUD): moi nhom gom nhieu quyen nho
 * - Gan / go nhom quyen cho tai khoan
 */
@Service
@RequiredArgsConstructor
@Log4j2
public class PermissionServiceImpl implements PermissionService {

    private static final int MAX_PAGE_SIZE = 10;

    private final PermissionRepository permissionRepository;
    private final PermissionGroupRepository groupRepository;
    private final AccountRepository accountRepository;

    @Override
    public List<PermissionResponse> listPermissions() {
        return permissionRepository.findAll(Sort.by("code")).stream()
                .map(p -> PermissionResponse.builder()
                        .id(p.getId()).code(p.getCode()).description(p.getDescription()).build())
                .collect(Collectors.toList());
    }

    @Override
    public List<PermissionGroupResponse> listGroups() {
        return groupRepository.findAll(Sort.by("id")).stream()
                .map(this::toGroupResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PermissionGroupResponse createGroup(PermissionGroupRequest request) {
        String name = request.getName().trim();
        if (DataSeeder.GROUP_FULL.equals(name)) {
            throw new BadRequestException("Không thể tạo lại nhóm quản trị toàn quyền hệ thống");
        }
        if (groupRepository.existsByName(name)) {
            throw new BadRequestException("Tên nhóm quyền đã tồn tại");
        }
        Set<Permission> permissions = resolvePermissions(request.getPermissionCodes());
        rejectPermissionManagement(permissions);
        PermissionGroup group = PermissionGroup.builder()
                .name(name)
                .description(request.getDescription())
                .permissions(permissions)
                .build();
        group = groupRepository.save(group);
        log.info("Tao nhom quyen: id={}, name={}", group.getId(), group.getName());
        return toGroupResponse(group);
    }

    @Override
    @Transactional
    public PermissionGroupResponse updateGroup(Long id, PermissionGroupRequest request) {
        PermissionGroup group = findGroupOrThrow(id);
        if (DataSeeder.GROUP_FULL.equals(group.getName()) || hasPermissionManagement(group)) {
            throw new BadRequestException("Nhóm quản trị toàn quyền hệ thống không thể chỉnh sửa");
        }
        String name = request.getName().trim();
        if (DataSeeder.GROUP_FULL.equals(name)) {
            throw new BadRequestException("Tên này được dành riêng cho nhóm quản trị toàn quyền");
        }
        if (!group.getName().equals(name) && groupRepository.existsByName(name)) {
            throw new BadRequestException("Tên nhóm quyền đã tồn tại");
        }
        group.setName(name);
        group.setDescription(request.getDescription());
        Set<Permission> permissions = resolvePermissions(request.getPermissionCodes());
        rejectPermissionManagement(permissions);
        group.setPermissions(permissions);
        log.info("Cap nhat nhom quyen: id={}", id);
        return toGroupResponse(groupRepository.save(group));
    }

    @Override
    @Transactional
    public void deleteGroup(Long id) {
        PermissionGroup group = findGroupOrThrow(id);
        if (DataSeeder.GROUP_FULL.equals(group.getName()) || hasPermissionManagement(group)) {
            throw new BadRequestException("Không thể xóa nhóm quản trị toàn quyền hệ thống");
        }
        if (accountRepository.existsByPermissionGroup_Id(id)) {
            throw new BadRequestException("Nhóm quyền đang được gán cho tài khoản, hãy gỡ khỏi tài khoản trước khi xóa");
        }
        groupRepository.delete(group);
        log.info("Xoa nhom quyen: id={}", id);
    }

    @Override
    public PageResponse<AccountPermissionResponse> listAccounts(int page, int size) {
        int safeSize = Math.min(size <= 0 ? MAX_PAGE_SIZE : size, MAX_PAGE_SIZE);
        Page<Account> result = accountRepository.findAll(PageRequest.of(Math.max(page, 0), safeSize, Sort.by("id")));
        return PageResponse.from(result.map(this::toAccountResponse));
    }

    @Override
    @Transactional
    public AccountPermissionResponse assignGroups(Long accountId, AssignGroupsRequest request) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với id=" + accountId));

        // Chan tu doi quyen cua chinh minh de tranh vo y tu khoa quyen quan tri
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        if (account.getEmail().equals(currentEmail)) {
            throw new BadRequestException("Không thể tự thay đổi nhóm quyền của chính mình");
        }

        PermissionGroup group = findGroupOrThrow(request.getGroupId());
        if (account.getRole() != com.fresher.library.entity.Role.ADMIN
                && (DataSeeder.GROUP_FULL.equals(group.getName()) || hasPermissionManagement(group))) {
            throw new BadRequestException("Chỉ tài khoản quản trị mới được gán nhóm quản trị toàn quyền");
        }
        account.setPermissionGroup(group);
        log.info("Gan nhom quyen {} cho account id={}", group.getId(), accountId);
        return toAccountResponse(accountRepository.save(account));
    }

    // ---------- helper ----------

    private Set<Permission> resolvePermissions(List<String> codes) {
        Set<String> distinct = new HashSet<>(codes);
        List<Permission> found = permissionRepository.findByCodeIn(distinct);
        if (found.size() != distinct.size()) {
            throw new BadRequestException("Có mã quyền không tồn tại trong hệ thống");
        }
        return new HashSet<>(found);
    }

    private void rejectPermissionManagement(Set<Permission> permissions) {
        if (permissions.stream().anyMatch(p -> "PERMISSION_MANAGE".equals(p.getCode()))) {
            throw new BadRequestException("Quyền quản lý phân quyền chỉ được cấp trong nhóm quản trị toàn quyền hệ thống");
        }
    }

    private boolean hasPermissionManagement(PermissionGroup group) {
        return group.getPermissions().stream().anyMatch(p -> "PERMISSION_MANAGE".equals(p.getCode()));
    }

    private PermissionGroup findGroupOrThrow(Long id) {
        return groupRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhóm quyền với id=" + id));
    }

    private PermissionGroupResponse toGroupResponse(PermissionGroup g) {
        return PermissionGroupResponse.builder()
                .id(g.getId())
                .name(g.getName())
                .description(g.getDescription())
                .permissionCodes(g.getPermissions().stream().map(Permission::getCode).sorted().collect(Collectors.toList()))
                .build();
    }

    private AccountPermissionResponse toAccountResponse(Account a) {
        return AccountPermissionResponse.builder()
                .accountId(a.getId())
                .email(a.getEmail())
                .role(a.getRole().name())
                .group(a.getPermissionGroup() == null ? null : toGroupResponse(a.getPermissionGroup()))
                .build();
    }
}
