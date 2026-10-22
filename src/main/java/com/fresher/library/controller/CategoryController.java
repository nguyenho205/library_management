package com.fresher.library.controller;

import com.fresher.library.dto.request.CategoryRequest;
import com.fresher.library.dto.response.ApiResponse;
import com.fresher.library.dto.response.CategoryResponse;
import com.fresher.library.entity.Category;
import com.fresher.library.exception.BadRequestException;
import com.fresher.library.repository.CategoryRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Chuc nang: THE LOAI SACH (phuc vu dropdown chon the loai tren UI khi them/sua sach)
 * - GET  /api/categories : danh sach the loai (moi user da dang nhap)
 * - POST /api/categories : tao the loai moi (chi ADMIN)
 */
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Tag(name = "Category", description = "The loai sach")
public class CategoryController {

    private final CategoryRepository categoryRepository;

    @GetMapping
    @PreAuthorize("hasAuthority('BOOK_VIEW')")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> list() {
        List<CategoryResponse> result = categoryRepository.findAll().stream()
                .map(c -> CategoryResponse.builder().id(c.getId()).name(c.getName()).build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @Transactional
    @PreAuthorize("hasAuthority('BOOK_CREATE')")
    public ResponseEntity<ApiResponse<CategoryResponse>> create(@Valid @RequestBody CategoryRequest request) {
        if (categoryRepository.findByNameIgnoreCase(request.getName().trim()).isPresent()) {
            throw new BadRequestException("Thể loại này đã tồn tại");
        }
        Category saved = categoryRepository.save(Category.builder().name(request.getName().trim()).build());
        return ResponseEntity.ok(ApiResponse.success("Thêm thể loại thành công",
                CategoryResponse.builder().id(saved.getId()).name(saved.getName()).build()));
    }
}
