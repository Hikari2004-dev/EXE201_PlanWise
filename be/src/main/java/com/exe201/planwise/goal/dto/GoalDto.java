package com.exe201.planwise.goal.dto;

import com.exe201.planwise.goal.entity.Goal;
import com.exe201.planwise.goal.enums.GoalPeriod;
import com.exe201.planwise.goal.enums.GoalType;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record GoalDto(
        UUID id,
        String title,
        String description,
        UUID categoryId,
        String categoryName,
        String categoryColor,
        GoalType goalType,
        GoalPeriod period,
        LocalDate targetDate,
        int progress,
        String color,
        boolean isCompleted,
        OffsetDateTime completedAt,
        int sortOrder,
        List<MilestoneDto> milestones,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static GoalDto from(Goal goal) {
        return new GoalDto(
                goal.getId(),
                goal.getTitle(),
                goal.getDescription(),
                goal.getCategory().getId(),
                goal.getCategory().getName(),
                goal.getCategory().getColor().name(),
                goal.getGoalType(),                goal.getPeriod(),
                goal.getTargetDate(),
                goal.getProgress(),
                goal.getColor(),
                goal.isCompleted(),
                goal.getCompletedAt(),
                goal.getSortOrder(),
                goal.getMilestones() != null
                        ? goal.getMilestones().stream().map(MilestoneDto::from).toList()
                        : List.of(),
                goal.getCreatedAt(),
                goal.getUpdatedAt()
        );
    }

    public static GoalDto fromWithoutMilestones(Goal goal) {
        return new GoalDto(
                goal.getId(),
                goal.getTitle(),
                goal.getDescription(),
                goal.getCategory().getId(),
                goal.getCategory().getName(),
                goal.getCategory().getColor().name(),
                goal.getGoalType(),                goal.getPeriod(),
                goal.getTargetDate(),
                goal.getProgress(),
                goal.getColor(),
                goal.isCompleted(),
                goal.getCompletedAt(),
                goal.getSortOrder(),
                null,
                goal.getCreatedAt(),
                goal.getUpdatedAt()
        );
    }
}
