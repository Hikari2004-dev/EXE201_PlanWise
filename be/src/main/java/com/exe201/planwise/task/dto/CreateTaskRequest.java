package com.exe201.planwise.task.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record CreateTaskRequest(
        @NotBlank(message = "Tiêu đề không được để trống")
        @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
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

        String status,

        Short estimatedTime,

        List<String> contexts,

        List<String> checklist,

        Boolean showOnCalendar
) {
    public CreateTaskRequest {
        if (priority == null || priority.isBlank()) priority = "Trung bình";
        if (color == null || color.isBlank()) color = "indigo";
        if (status == null || status.isBlank()) status = "IN_PROGRESS";
        if (showOnCalendar == null) showOnCalendar = true;
    }
}
