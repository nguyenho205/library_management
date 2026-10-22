package com.fresher.library.repository.specification;

import com.fresher.library.entity.Author;
import com.fresher.library.entity.Book;
import com.fresher.library.entity.BookStatus;
import com.fresher.library.entity.Category;
import jakarta.persistence.criteria.Join;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

/**
 * Specification xay dung dieu kien tim kiem Sach dong theo nhieu tieu chi (API search).
 */
public class BookSpecification {

    private BookSpecification() {
    }

    public static Specification<Book> withFilters(String title, String isbn, String authorName, Long categoryId, BookStatus status) {
        return (root, query, cb) -> {
            query.distinct(true);
            var predicate = cb.conjunction();

            if (StringUtils.hasText(title)) {
                predicate = cb.and(predicate, cb.like(cb.lower(root.get("title")), "%" + title.toLowerCase() + "%"));
            }
            if (StringUtils.hasText(isbn)) {
                predicate = cb.and(predicate, cb.like(cb.lower(root.get("isbn")), "%" + isbn.toLowerCase() + "%"));
            }
            if (categoryId != null) {
                Join<Book, Category> categoryJoin = root.join("category");
                predicate = cb.and(predicate, cb.equal(categoryJoin.get("id"), categoryId));
            }
            if (StringUtils.hasText(authorName)) {
                Join<Book, Author> authorJoin = root.join("authors");
                predicate = cb.and(predicate, cb.like(cb.lower(authorJoin.get("name")), "%" + authorName.toLowerCase() + "%"));
            }
            if (status != null) {
                predicate = cb.and(predicate, cb.equal(root.get("status"), status));
            }
            return predicate;
        };
    }
}
