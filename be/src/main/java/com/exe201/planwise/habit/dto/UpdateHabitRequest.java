package com.exe201.planwise.habit.dto;

import com.exe201.planwise.habit.enums.HabitFrequency;
import jakarta.validation.constraints.Size;

public record UpdateHabitRequest(
        @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
        String title,

        String description,

        HabitFrequency frequency,

        Short targetCount,

        String color,

        Boolean isActive,

        Integer sortOrder
) {}
