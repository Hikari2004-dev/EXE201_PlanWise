package com.exe201.planwise.goal.dto;

import com.exe201.planwise.goal.enums.GoalPeriod;
import com.exe201.planwise.goal.enums.GoalType;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.UUID;

public record CreateGoalRequest(
        @NotBlank(message = "Tiêu đề không được để trống")
        @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
        String title,

        String description,

        @NotNull(message = "Danh mục không được để trống")
        UUID categoryId,

        GoalType goalType,

        @NotNull(message = "Kỳ hạn không được để trống")
        GoalPeriod period,

        LocalDate targetDate,

        String color
) {
    public CreateGoalRequest {
        if (goalType == null) goalType = GoalType.SMART;
        if (color == null || color.isBlank()) color = "indigo";
    }
}
