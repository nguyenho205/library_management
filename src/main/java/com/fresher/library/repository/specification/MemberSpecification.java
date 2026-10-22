package com.fresher.library.repository.specification;

import com.fresher.library.entity.Book;
import com.fresher.library.entity.BorrowRecord;
import com.fresher.library.entity.Member;
import jakarta.persistence.criteria.Join;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.LocalDate;

/**
 * Specification tim kiem Member theo nhieu tieu chi (toi thieu 4-5 dieu kien theo yeu cau de bai):
 * 1. Theo ten (like)
 * 2. Theo email
 * 3. Theo ten sach da/dang muon (join BorrowRecord -> Book)
 * 4. Theo sach dang muon - chon tu combobox (bookId)
 * 5. Theo khoang ngay sinh (dateOfBirth from - to)
 */
public class MemberSpecification {

    private MemberSpecification() {
    }

    public static Specification<Member> withFilters(String fullName,
                                                      String email,
                                                      String bookTitle,
                                                      Long bookId,
                                                      LocalDate dobFrom,
                                                      LocalDate dobTo,
                                                      Boolean enabled) {
        return (root, query, cb) -> {
            query.distinct(true);
            var predicate = cb.conjunction();

            if (StringUtils.hasText(fullName)) {
                predicate = cb.and(predicate, cb.like(cb.lower(root.get("fullName")), "%" + fullName.toLowerCase() + "%"));
            }
            if (StringUtils.hasText(email)) {
                predicate = cb.and(predicate, cb.like(cb.lower(root.get("account").get("email")), "%" + email.toLowerCase() + "%"));
            }
            if (StringUtils.hasText(bookTitle) || bookId != null) {
                Join<Member, BorrowRecord> borrowJoin = root.join("borrowRecords");
                Join<BorrowRecord, Book> bookJoin = borrowJoin.join("book");
                if (StringUtils.hasText(bookTitle)) {
                    predicate = cb.and(predicate, cb.like(cb.lower(bookJoin.get("title")), "%" + bookTitle.toLowerCase() + "%"));
                }
                if (bookId != null) {
                    predicate = cb.and(predicate, cb.equal(bookJoin.get("id"), bookId));
                }
            }
            if (dobFrom != null) {
                predicate = cb.and(predicate, cb.greaterThanOrEqualTo(root.get("dateOfBirth"), dobFrom));
            }
            if (dobTo != null) {
                predicate = cb.and(predicate, cb.lessThanOrEqualTo(root.get("dateOfBirth"), dobTo));
            }
            if (enabled != null) {
                predicate = cb.and(predicate, cb.equal(root.get("account").get("enabled"), enabled));
            }
            return predicate;
        };
    }
}
