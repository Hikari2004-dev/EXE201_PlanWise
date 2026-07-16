package com.exe201.planwise.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record GoalTaskDraft(
        @NotBlank(message = "Tiêu đề công việc không được để trống")
        @Size(max = 255, message = "Tiêu đề công việc không được vượt quá 255 ký tự")
        String title,

        String description,

        LocalDate dueDate,

        String priority,

        Short estimatedHours
) {}
