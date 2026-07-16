package com.exe201.planwise.ai.features.planner.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record PlannerEventDraft(
        @NotBlank(message = "Tiêu đề sự kiện không được để trống")
        @Size(max = 255, message = "Tiêu đề sự kiện không được vượt quá 255 ký tự")
        String title,

        LocalDate eventDate,

        Integer startHour,

        Integer startMin,

        Double duration,

        String color,

        String location,

        String notes,

        UUID categoryId,

        Boolean isRecurring,

        String recurrenceRule
) {}
