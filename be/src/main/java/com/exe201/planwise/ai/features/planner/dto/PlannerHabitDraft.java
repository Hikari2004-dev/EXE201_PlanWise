package com.exe201.planwise.ai.features.planner.dto;

import com.exe201.planwise.habit.enums.HabitFrequency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record PlannerHabitDraft(
        @NotBlank(message = "Tieu de thoi quen khong duoc de trong")
        @Size(max = 255, message = "Tieu de thoi quen khong duoc vuot qua 255 ky tu")
        String title,

        String description,

        HabitFrequency frequency,

        Short targetCount,

        Set<String> repeatDays
) {
    public PlannerHabitDraft {
        if (repeatDays == null) repeatDays = Set.of();
    }
}
