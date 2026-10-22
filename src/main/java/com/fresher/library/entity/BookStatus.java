package com.fresher.library.entity;

/**
 * Trang thai luu hanh cua sach trong thu vien:
 * - IN_CIRCULATION: Dang luu hanh / Dang phat hanh (doc gia co the tim thay va muon)
 * - DISCONTINUED: Ngung luu hanh (khong cho phep muon moi, cac luot muon cu van co the tra)
 */
public enum BookStatus {
    IN_CIRCULATION,
    DISCONTINUED
}
