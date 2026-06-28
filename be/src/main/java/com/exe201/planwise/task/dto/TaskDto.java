package com.exe201.planwise.task.dto;

import com.exe201.planwise.task.entity.Task;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record TaskDto(
        UUID id,
        String title,
        String description,
        OffsetDateTime dueDate,
        OffsetDateTime scheduledAt,
        String priority,
        String color,
        String status,
        boolean completed,
        OffsetDateTime completedAt,
        String eisenhowerMatrix,
        Short estimatedTime,
        Short actualTime,
        List<String> contexts,
        List<String> checklist,
        UUID categoryId,
        String categoryName,
        String categoryColor,
        UUID goalId,
        UUID milestoneId,
        boolean showOnCalendar,
        int sortOrder,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static TaskDto from(Task task, String status) {
        return new TaskDto(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getDueDate(),
                task.getScheduledAt(),
                task.getPriority() != null ? task.getPriority().getDbValue() : null,
                task.getColor() != null ? task.getColor().name() : null,
                status,
                task.isCompleted(),
                task.getCompletedAt(),
                task.getEisenhowerMatrix() != null ? task.getEisenhowerMatrix().name() : null,
                task.getEstimatedTime(),
                task.getActualTime(),
                task.getContexts(),
                task.getChecklist(),
                task.getCategory() != null ? task.getCategory().getId() : null,
                task.getCategory() != null ? task.getCategory().getName() : null,
                task.getCategory() != null && task.getCategory().getColor() != null ? task.getCategory().getColor().name() : null,
                task.getGoal() != null ? task.getGoal().getId() : null,
                task.getMilestone() != null ? task.getMilestone().getId() : null,
                task.isShowOnCalendar(),
                task.getSortOrder(),
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }
}
