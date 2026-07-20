package com.exe201.planwise.ai.features.planner.dto;

import com.exe201.planwise.habit.enums.HabitFrequency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record PlannerHabitDraft(
        @NotBlank(message = "Tiêu đề thói quen không được để trống")
        @Size(max = 255, message = "Tiêu đề thói quen không được vượt quá 255 ký tự")
        String title,

        String description,

        HabitFrequency frequency,

        Short targetCount,

        Set<String> repeatDays,

        String color
) {
    public PlannerHabitDraft {
        if (repeatDays == null) repeatDays = Set.of();
    }
}
