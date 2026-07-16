package com.exe201.planwise.ai.features.goal.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record GoalMilestoneDraft(
        @NotBlank(message = "Tiêu đề cột mốc không được để trống")
        @Size(max = 255, message = "Tiêu đề cột mốc không được vượt quá 255 ký tự")
        String title,

        String description,

        LocalDate targetDate,

        @Valid
        List<GoalTaskDraft> tasks
) {}
