package com.exe201.planwise.event.dto;

import com.exe201.planwise.event.entity.CalendarEvent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record CalendarEventDto(
        UUID id,
        String title,
        LocalDate eventDate,
        int startHour,
        int startMin,
        double duration,
        String color,
        String location,
        String notes,
        boolean isRecurring,
        String recurrenceRule,
        UUID categoryId,
        String categoryName,
        String categoryColor,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static CalendarEventDto from(CalendarEvent event) {
        return new CalendarEventDto(
                event.getId(),
                event.getTitle(),
                event.getEventDate(),
                event.getStartHour(),
                event.getStartMin(),
                event.getDuration(),
                event.getColor(),
                event.getLocation(),
                event.getNotes(),
                event.isRecurring(),
                event.getRecurrenceRule(),
                event.getCategory() != null ? event.getCategory().getId() : null,
                event.getCategory() != null ? event.getCategory().getName() : null,
                event.getCategory() != null ? event.getCategory().getColor().name() : null,
                event.getCreatedAt(),
                event.getUpdatedAt()
        );
    }
}
