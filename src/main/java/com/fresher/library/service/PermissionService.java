package com.fresher.library.service;

import com.fresher.library.dto.request.AssignGroupsRequest;
import com.fresher.library.dto.request.PermissionGroupRequest;
import com.fresher.library.dto.response.AccountPermissionResponse;
import com.fresher.library.dto.response.PageResponse;
import com.fresher.library.dto.response.PermissionGroupResponse;
import com.fresher.library.dto.response.PermissionResponse;

import java.util.List;

public interface PermissionService {
    List<PermissionResponse> listPermissions();
    List<PermissionGroupResponse> listGroups();
    PermissionGroupResponse createGroup(PermissionGroupRequest request);
    PermissionGroupResponse updateGroup(Long id, PermissionGroupRequest request);
    void deleteGroup(Long id);
    PageResponse<AccountPermissionResponse> listAccounts(int page, int size);
    AccountPermissionResponse assignGroups(Long accountId, AssignGroupsRequest request);
}
