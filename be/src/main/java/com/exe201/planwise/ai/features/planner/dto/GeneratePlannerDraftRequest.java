package com.exe201.planwise.ai.features.planner.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record GeneratePlannerDraftRequest(
        @NotBlank(message = "Yêu cầu lập kế hoạch không được để trống")
        @Size(max = 2000, message = "Yêu cầu lập kế hoạch không được vượt quá 2000 ký tự")
        String message,

        LocalDate startDate,

        LocalDate endDate,

        List<@Size(max = 255, message = "Ràng buộc không được vượt quá 255 ký tự") String> constraints
) {}
