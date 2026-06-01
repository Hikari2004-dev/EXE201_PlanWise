package com.exe201.planwise.vision.dto;

import com.exe201.planwise.vision.entity.VisionItem;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.UUID;

public record VisionItemDto(
        UUID id,
        String title,
        String description,
        String category,
        String imageUrl,
        String quote,
        short sortOrder,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static VisionItemDto from(VisionItem item) {
        return new VisionItemDto(
                item.getId(),
                item.getTitle(),
                item.getDescription(),
                item.getCategory(),
                item.getImageUrl(),
                item.getQuote(),
                item.getSortOrder(),
                item.getCreatedAt(),
                item.getUpdatedAt()
        );
    }
}
