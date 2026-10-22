package com.fresher.library.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Book = sach trong thu vien.
 * Quan he N-1 voi Category, N-N voi Author, 1-N voi BorrowRecord.
 */
@Entity
@Table(name = "book")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String isbn;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(name = "quantity_total", nullable = false)
    private Integer quantityTotal;

    @Column(name = "quantity_available", nullable = false)
    private Integer quantityAvailable;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /** Optimistic locking: tranh truong hop 2 request muon sach cung luc lam sai lech ton kho */
    @Version
    @Builder.Default
    private Long version = 0L;

    /** Trang thai phat hanh: IN_CIRCULATION (dang phat hanh/luu hanh), DISCONTINUED (ngung luu hanh) */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private BookStatus status = BookStatus.IN_CIRCULATION;

    // Quan he N-1: nhieu Book thuoc 1 Category
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    // Quan he N-N: 1 Book co nhieu Author, 1 Author viet nhieu Book
    @Builder.Default
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "book_author",
            joinColumns = @JoinColumn(name = "book_id"),
            inverseJoinColumns = @JoinColumn(name = "author_id")
    )
    private Set<Author> authors = new HashSet<>();

    // Quan he 1-N: 1 Book co nhieu BorrowRecord
    @Builder.Default
    @OneToMany(mappedBy = "book")
    @JsonIgnore
    private List<BorrowRecord> borrowRecords = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.quantityAvailable == null) {
            this.quantityAvailable = this.quantityTotal;
        }
        if (this.status == null) {
            this.status = BookStatus.IN_CIRCULATION;
        }
    }
}
