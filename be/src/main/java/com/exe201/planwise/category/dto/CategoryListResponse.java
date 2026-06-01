package com.exe201.planwise.category.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record CategoryListResponse(
        List<CategoryDto> categories,
        int totalCount,
        int defaultCount,
        int customCount,
        boolean isPremium,
        int freeLimit
) {
    public static CategoryListResponse of(List<CategoryDto> categories, boolean isPremium) {
        int defaultCount = (int) categories.stream().filter(CategoryDto::isDefault).count();
        int customCount = (int) categories.stream().filter(c -> !c.isDefault()).count();

        return CategoryListResponse.builder()
                .categories(categories)
                .totalCount(categories.size())
                .defaultCount(defaultCount)
                .customCount(customCount)
                .isPremium(isPremium)
                .freeLimit(isPremium ? Integer.MAX_VALUE : 6)
                .build();
    }
}
