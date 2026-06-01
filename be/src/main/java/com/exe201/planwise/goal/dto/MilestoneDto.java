package com.exe201.planwise.goal.dto;

import com.exe201.planwise.goal.entity.Milestone;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record MilestoneDto(
        UUID id,
        String title,
        String description,
        LocalDate targetDate,
        boolean completed,
        OffsetDateTime completedAt,
        short sortOrder,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static MilestoneDto from(Milestone milestone) {
        return new MilestoneDto(
                milestone.getId(),
                milestone.getTitle(),
                milestone.getDescription(),
                milestone.getTargetDate(),
                milestone.isCompleted(),
                milestone.getCompletedAt(),
                milestone.getSortOrder(),
                milestone.getCreatedAt(),
                milestone.getUpdatedAt()
        );
    }
}
