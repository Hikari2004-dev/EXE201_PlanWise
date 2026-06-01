package com.exe201.planwise.goal.dto;

import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UpdateMilestoneRequest(
        @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
        String title,

        String description,

        LocalDate targetDate,

        Boolean completed
) {}
