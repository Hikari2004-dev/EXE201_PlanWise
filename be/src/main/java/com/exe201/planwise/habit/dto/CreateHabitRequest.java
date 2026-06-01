package com.exe201.planwise.habit.dto;

import com.exe201.planwise.habit.enums.HabitFrequency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateHabitRequest(
        @NotBlank(message = "Tiêu đề không được để trống")
        @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
        String title,

        String description,

        HabitFrequency frequency,

        short targetCount,

        String color
) {
    public CreateHabitRequest {
        if (frequency == null) frequency = HabitFrequency.daily;
        if (targetCount <= 0) targetCount = 1;
        if (color == null || color.isBlank()) color = "indigo";
    }
}
