package com.exe201.planwise.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateEventRequest(
        @NotBlank(message = "Tiêu đề không được để trống")
        @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
        String title,

        @NotNull(message = "Ngày sự kiện không được để trống")
        LocalDate eventDate,

        int startHour,

        int startMin,

        double duration,

        String color,

        String location,

        String notes,

        UUID categoryId,

        boolean isRecurring,

        String recurrenceRule
) {
    public CreateEventRequest {
        if (startMin < 0) startMin = 0;
        if (startMin > 59) startMin = 59;
        if (color == null || color.isBlank()) color = "indigo";
        if (duration <= 0) duration = 1;
    }
}
