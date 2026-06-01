package com.exe201.planwise.task.dto;

import com.exe201.planwise.task.entity.Task;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record TaskDto(
        UUID id,
        String title,
        String description,
        LocalDate dueDate,
        String priority,
        String color,
        boolean completed,
        OffsetDateTime completedAt,
        String eisenhowerMatrix,
        Short estimatedTime,
        Short actualTime,
        List<String> contexts,
        UUID categoryId,
        String categoryName,
        String categoryColor,
        int sortOrder,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static TaskDto from(Task task) {
        return new TaskDto(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getDueDate(),
                task.getPriority() != null ? task.getPriority().getDbValue() : null,
                task.getColor() != null ? task.getColor().name() : null,
                task.isCompleted(),
                task.getCompletedAt(),
                task.getEisenhowerMatrix() != null ? task.getEisenhowerMatrix().name() : null,
                task.getEstimatedTime(),
                task.getActualTime(),
                task.getContexts(),
                task.getCategory() != null ? task.getCategory().getId() : null,
                task.getCategory() != null ? task.getCategory().getName() : null,
                task.getCategory() != null ? task.getCategory().getColor() : null,
                task.getSortOrder(),
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }
}
