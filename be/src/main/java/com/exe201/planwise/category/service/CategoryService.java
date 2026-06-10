package com.exe201.planwise.category.service;

import com.exe201.planwise.category.dto.*;
import com.exe201.planwise.category.entity.Category;
import com.exe201.planwise.category.repository.CategoryRepository;
import com.exe201.planwise.common.enums.EventColor;
import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import com.exe201.planwise.user.entity.User;
import com.exe201.planwise.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class CategoryService {

    private static final int DEFAULT_CATEGORIES_COUNT = 6;

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public CategoryListResponse getCategories(UUID userId) {
        User user = findUser(userId);
        List<Category> categories = categoryRepository.findByUserIdOrderBySortOrderAsc(userId);
        List<CategoryDto> categoryDtos = categories.stream().map(CategoryDto::from).toList();
        return CategoryListResponse.of(categoryDtos, user.isPremium());
    }

    @Transactional(readOnly = true)
    public CategoryDto getCategoryById(UUID userId, UUID categoryId) {
        Category category = findCategoryAndValidateOwnership(categoryId, userId);
        return CategoryDto.from(category);
    }

    @Transactional
    public CategoryDto createCategory(UUID userId, CreateCategoryRequest request) {
        User user = findUser(userId);
        String normalizedName = normalizeName(request.name());

        if (!user.isPremium()) {
            long customCount = categoryRepository.countCustomByUserId(userId);
            if (customCount >= DEFAULT_CATEGORIES_COUNT) {
                throw new AppException(ErrorCode.CATEGORY_LIMIT_EXCEEDED);
            }
        }

        if (categoryRepository.existsByUserIdAndNameNormalized(userId, normalizedName)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Danh mục đã tồn tại");
        }

        long maxSortOrder = categoryRepository.findByUserIdOrderBySortOrderAsc(userId)
                .stream()
                .mapToLong(Category::getSortOrder)
                .max()
                .orElse(DEFAULT_CATEGORIES_COUNT);

        Category category = Category.builder()
                .user(user)
                .name(normalizedName)
                .color(parseColor(request.color()))
                .sortOrder((short) (maxSortOrder + 1))
                .isDefault(false)
                .build();

        category = categoryRepository.save(category);
        log.info("Created category {} for user {}", category.getId(), userId);

        return CategoryDto.from(category);
    }

    @Transactional
    public CategoryDto updateCategory(UUID userId, UUID categoryId, UpdateCategoryRequest request) {
        Category category = findCategoryAndValidateOwnership(categoryId, userId);

        if (category.isDefault() && request.name() != null) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Không thể đổi tên danh mục mặc định");
        }

        if (request.name() != null && !category.isDefault()) {
            String normalizedName = normalizeName(request.name());
            if (categoryRepository.existsByUserIdAndNameNormalizedExcludingId(userId, normalizedName, categoryId)) {
                throw new AppException(ErrorCode.BAD_REQUEST, "Danh mục đã tồn tại");
            }
            category.setName(normalizedName);
        }
        if (request.color() != null) {
            category.setColor(parseColor(request.color()));
        }
        if (request.sortOrder() != null) {
            category.setSortOrder((short) request.sortOrder().intValue());
        }

        category = categoryRepository.save(category);
        log.info("Updated category {}", categoryId);

        return CategoryDto.from(category);
    }

    @Transactional
    public void deleteCategory(UUID userId, UUID categoryId) {
        Category category = findCategoryAndValidateOwnership(categoryId, userId);

        if (category.isDefault()) {
            throw new AppException(ErrorCode.CANNOT_DELETE_DEFAULT_CATEGORY);
        }

        categoryRepository.delete(category);
        log.info("Deleted category {} for user {}", categoryId, userId);
    }

    private User findUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private Category findCategoryAndValidateOwnership(UUID categoryId, UUID userId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        if (!category.getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.CATEGORY_NOT_FOUND);
        }
        return category;
    }

    private EventColor parseColor(String color) {
        if (color == null || color.isBlank()) {
            return EventColor.indigo;
        }

        try {
            return EventColor.valueOf(color.trim().toLowerCase());
        } catch (IllegalArgumentException ignored) {
            return EventColor.indigo;
        }
    }

    private String normalizeName(String name) {
        return name == null ? null : name.trim().replaceAll("\\s+", " ");
    }
}
