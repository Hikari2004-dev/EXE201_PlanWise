package com.exe201.planwise.integration.calendar.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UpdateExternalCalendarEventRequest(
        @NotBlank(message = "Calendar ID không được để trống")
        String externalCalendarId,

        @NotBlank(message = "Event ID không được để trống")
        String externalEventId,

        @NotBlank(message = "Tiêu đề không được để trống")
        @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
        String title,

        @NotNull(message = "Ngày sự kiện không được để trống")
        LocalDate eventDate,

        int startHour,

        int startMin,

        double duration,

        String location,

        String notes,

        boolean allDay,

        boolean isRecurring,

        String recurrenceRule
) {}
