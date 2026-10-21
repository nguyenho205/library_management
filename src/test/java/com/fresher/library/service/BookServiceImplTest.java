package com.fresher.library.service;

import com.fresher.library.dto.request.BookRequest;
import com.fresher.library.dto.response.BookResponse;
import com.fresher.library.entity.Book;
import com.fresher.library.entity.Category;
import com.fresher.library.exception.BadRequestException;
import com.fresher.library.repository.AuthorRepository;
import com.fresher.library.repository.BookRepository;
import com.fresher.library.repository.CategoryRepository;
import com.fresher.library.service.impl.BookServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Test cac rule nghiep vu quan trong cua chuc nang Quan ly Sach:
 * 1. Khong cho tao sach neu ISBN da ton tai
 * 2. Khong cho giam quantityTotal xuong thap hon so luong dang duoc muon
 */
@ExtendWith(MockitoExtension.class)
class BookServiceImplTest {

    @Mock
    private BookRepository bookRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private AuthorRepository authorRepository;

    @InjectMocks
    private BookServiceImpl bookService;

    @Test
    void create_isbnDaTonTai_phaiNemBadRequestException() {
        BookRequest request = new BookRequest();
        request.setIsbn("978-123");
        request.setTitle("Java co ban");
        request.setQuantityTotal(10);
        request.setCategoryId(1L);

        when(bookRepository.existsByIsbn("978-123")).thenReturn(true);

        assertThatThrownBy(() -> bookService.create(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("ISBN");
    }

    @Test
    void create_hopLe_phaiTraVeBookResponseDungDuLieu() {
        BookRequest request = new BookRequest();
        request.setIsbn("978-999");
        request.setTitle("Spring Boot co ban");
        request.setQuantityTotal(10);
        request.setCategoryId(1L);
        request.setAuthorNames(List.of());

        Category category = Category.builder().id(1L).name("Lap trinh").build();
        when(bookRepository.existsByIsbn("978-999")).thenReturn(false);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(bookRepository.save(any(Book.class))).thenAnswer(inv -> {
            Book b = inv.getArgument(0);
            b.setId(1L);
            return b;
        });

        BookResponse response = bookService.create(request);

        assertThat(response.getIsbn()).isEqualTo("978-999");
        assertThat(response.getQuantityAvailable()).isEqualTo(10); // luc tao: available = total
        assertThat(response.getCategoryName()).isEqualTo("Lap trinh");
    }

    @Test
    void update_giamSoLuongThapHonSoDangMuon_phaiNemBadRequestException() {
        // Sach co 10 cuon, dang co 4 cuon duoc muon (available = 6) -> khong the sua total xuong con 2
        Book existing = Book.builder()
                .id(1L).isbn("978-111").title("Clean Code")
                .quantityTotal(10).quantityAvailable(6).build();

        BookRequest request = new BookRequest();
        request.setIsbn("978-111");
        request.setTitle("Clean Code");
        request.setQuantityTotal(2); // qua it, vi dang co 4 cuon (10-6) dang bi muon
        request.setCategoryId(1L);

        when(bookRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(Category.builder().id(1L).name("X").build()));

        assertThatThrownBy(() -> bookService.update(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("nho hon so luong dang duoc muon");
    }
}
