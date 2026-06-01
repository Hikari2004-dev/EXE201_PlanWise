package com.exe201.planwise.event.dto;

import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record UpdateEventRequest(
        @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
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
