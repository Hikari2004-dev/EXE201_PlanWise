package com.exe201.planwise.category.dto;

import com.exe201.planwise.category.entity.Category;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CategoryDto(
        UUID id,
        String name,
        String color,
        short sortOrder,
        boolean isDefault,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt) {
    public static CategoryDto from(Category category) {
        return new CategoryDto(
                category.getId(),
                category.getName(),
                category.getColor().name(),
                category.getSortOrder(),
                category.isDefault(),
                category.getCreatedAt(),
                category.getUpdatedAt());
    }
}
