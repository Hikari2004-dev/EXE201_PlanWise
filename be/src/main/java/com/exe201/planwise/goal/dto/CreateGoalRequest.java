package com.exe201.planwise.goal.dto;

import com.exe201.planwise.goal.enums.GoalCategory;
import com.exe201.planwise.goal.enums.GoalPeriod;
import com.exe201.planwise.goal.enums.GoalType;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record CreateGoalRequest(
        @NotBlank(message = "Tiêu đề không được để trống")
        @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
        String title,

        String description,

        GoalCategory category,

        GoalType goalType,

        @NotNull(message = "Kỳ hạn không được để trống")
        GoalPeriod period,

        LocalDate targetDate,

        String color
) {
    public CreateGoalRequest {
        if (category == null) category = GoalCategory.career;
        if (goalType == null) goalType = GoalType.SMART;
        if (color == null || color.isBlank()) color = "indigo";
    }
}
