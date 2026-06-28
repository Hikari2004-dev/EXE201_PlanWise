package com.exe201.planwise.vision.dto;

import com.exe201.planwise.vision.entity.VisionItem;

import java.time.OffsetDateTime;
import java.util.UUID;

public record VisionItemDto(
        UUID id,
        String title,
        String description,
        UUID categoryId,
        String categoryName,
        String categoryColor,
        String imageUrl,
        String quote,
        short sortOrder,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static VisionItemDto from(
            VisionItem item,
            UUID categoryId,
            String categoryName,
            String categoryColor
    ) {
        return new VisionItemDto(
                item.getId(),
                item.getTitle(),
                item.getDescription(),
                categoryId,
                categoryName,
                categoryColor,
                item.getImageUrl(),
                item.getQuote(),
                item.getSortOrder(),
                item.getCreatedAt(),
                item.getUpdatedAt()
        );
    }
}
