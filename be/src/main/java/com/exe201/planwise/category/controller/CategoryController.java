package com.exe201.planwise.category.controller;

import com.exe201.planwise.category.dto.*;
import com.exe201.planwise.category.service.CategoryService;
import com.exe201.planwise.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    /**
     * GET /api/v1/categories
     * Lấy tất cả danh mục của người dùng.
     */
    @GetMapping
    public ResponseEntity<CategoryListResponse> getCategories(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(categoryService.getCategories(principal.getId()));
    }

    /**
     * GET /api/v1/categories/{categoryId}
     * Lấy chi tiết một danh mục.
     */
    @GetMapping("/{categoryId}")
    public ResponseEntity<CategoryDto> getCategoryById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID categoryId) {
        return ResponseEntity.ok(categoryService.getCategoryById(principal.getId(), categoryId));
    }

    /**
     * POST /api/v1/categories
     * Tạo danh mục mới.
     * FREE: chỉ được sử dụng 6 danh mục mặc định. PREMIUM: có thể tạo thêm danh mục tùy chỉnh.
     */
    @PostMapping
    public ResponseEntity<CategoryDto> createCategory(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(categoryService.createCategory(principal.getId(), request));
    }

    /**
     * PUT /api/v1/categories/{categoryId}
     * Cập nhật danh mục.
     */
    @PutMapping("/{categoryId}")
    public ResponseEntity<CategoryDto> updateCategory(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID categoryId,
            @Valid @RequestBody UpdateCategoryRequest request) {
        return ResponseEntity.ok(categoryService.updateCategory(principal.getId(), categoryId, request));
    }

    /**
     * DELETE /api/v1/categories/{categoryId}
     * Xóa danh mục tùy chỉnh (không thể xóa danh mục mặc định).
     */
    @DeleteMapping("/{categoryId}")
    public ResponseEntity<Void> deleteCategory(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID categoryId) {
        categoryService.deleteCategory(principal.getId(), categoryId);
        return ResponseEntity.noContent().build();
    }
}
