package com.exe201.planwise.goal.dto;

import com.exe201.planwise.goal.enums.GoalPeriod;
import com.exe201.planwise.goal.enums.GoalType;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record UpdateGoalRequest(
        @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
        String title,

        String description,

        UUID categoryId,

        GoalType goalType,

        GoalPeriod period,

        LocalDate targetDate,

        Integer progress,

        String color,

        Boolean isCompleted
) {}
