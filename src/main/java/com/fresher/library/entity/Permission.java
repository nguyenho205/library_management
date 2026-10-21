package com.fresher.library.entity;

import jakarta.persistence.*;
import lombok.*;

/** 1 quyen nho, vd BOOK_CREATE. Code dung de kiem tra o @PreAuthorize. */
@Entity
@Table(name = "permission")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @EqualsAndHashCode.Include
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(length = 255)
    private String description;
}
