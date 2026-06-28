package com.exe201.planwise.task.dto;

import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record UpdateTaskRequest(
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

        Boolean completed,

        List<String> contexts,

        List<String> checklist,

        Boolean showOnCalendar,

        Integer sortOrder
) {}
