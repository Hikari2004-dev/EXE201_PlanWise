package com.exe201.planwise.task.dto;

import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record UpdateTaskRequest(
        @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
        String title,

        String description,

        LocalDate dueDate,

        String priority,

        String color,

        UUID categoryId,

        String eisenhowerMatrix,

        Short estimatedTime,

        Boolean completed,

        List<String> contexts,

        Integer sortOrder
) {}
