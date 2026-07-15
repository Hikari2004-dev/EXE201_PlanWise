package com.exe201.planwise.ai.features.planner.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record PlannerTaskDraft(
        UUID existingTaskId,

        @NotBlank(message = "Tiêu đề công việc không được để trống")
        @Size(max = 255, message = "Tiêu đề công việc không được vượt quá 255 ký tự")
        String title,

        String description,

        OffsetDateTime dueDate,

        OffsetDateTime scheduledAt,

        String priority,

        String color,

        UUID categoryId,

        UUID goalId,

        UUID milestoneId,

        String eisenhowerMatrix,

        Short estimatedTime,

        List<String> contexts,

        List<String> checklist,

        Boolean showOnCalendar
) {
    public PlannerTaskDraft {
        if (contexts == null) contexts = List.of();
        if (checklist == null) checklist = List.of();
    }
}
