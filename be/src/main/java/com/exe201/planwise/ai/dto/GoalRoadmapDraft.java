package com.exe201.planwise.ai.dto;

import com.exe201.planwise.goal.enums.GoalPeriod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record GoalRoadmapDraft(
        @NotBlank(message = "Tiêu đề không được để trống")
        @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
        String title,

        String description,

        @NotNull(message = "Danh mục không được để trống")
        UUID categoryId,

        @NotNull(message = "Kỳ hạn không được để trống")
        GoalPeriod period,

        LocalDate targetDate,

        String priority,

        @Valid
        List<GoalMilestoneDraft> milestones
) {}
