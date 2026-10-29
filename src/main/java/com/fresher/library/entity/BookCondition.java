package com.fresher.library.entity;

public enum BookCondition {
    INTACT,         // Nguyen ven / Binh thuong (khong hu hai)
    LIGHT_DAMAGE,   // Hu hong nhe (quan bia, rach nhe, co the phuc hoi)
    HEAVY_DAMAGE,   // Hu hong nang (rach nat, mat trang, khong the su dung tiep)
    LOST            // Mat tai lieu / That lac
}
