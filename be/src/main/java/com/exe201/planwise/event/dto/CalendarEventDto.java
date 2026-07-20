package com.exe201.planwise.event.dto;

import com.exe201.planwise.event.entity.CalendarEvent;
import com.exe201.planwise.integration.calendar.model.ExternalCalendarEvent;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record CalendarEventDto(
        String id,
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
        OffsetDateTime updatedAt,
        String source,
        boolean readOnly,
        boolean allDay,
        String provider,
        String externalCalendarId,
        String externalEventId,
        String calendarName,
        String externalHtmlLink
) {
    public static CalendarEventDto from(CalendarEvent event) {
        return new CalendarEventDto(
                event.getId().toString(),
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
                event.getUpdatedAt(),
                "PLANWISE",
                false,
                false,
                null,
                null,
                null,
                "PlanWise",
                null
        );
    }

    public static CalendarEventDto from(ExternalCalendarEvent event) {
        return new CalendarEventDto(
                event.id(),
                event.title(),
                event.eventDate(),
                event.startHour(),
                event.startMin(),
                event.duration(),
                "blue",
                event.location(),
                event.notes(),
                event.recurring(),
                null,
                null,
                null,
                null,
                null,
                null,
                event.provider().toUpperCase(),
                true,
                event.allDay(),
                event.provider(),
                event.externalCalendarId(),
                event.externalEventId(),
                event.calendarName(),
                event.htmlLink()
        );
    }
}
