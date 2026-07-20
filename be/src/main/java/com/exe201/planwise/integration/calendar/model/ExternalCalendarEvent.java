package com.exe201.planwise.integration.calendar.model;

import java.time.LocalDate;

public record ExternalCalendarEvent(
        String id,
        String externalCalendarId,
        String externalEventId,
        String provider,
        String calendarName,
        String title,
        LocalDate eventDate,
        int startHour,
        int startMin,
        double duration,
        String location,
        String notes,
        boolean allDay,
        boolean recurring,
        String htmlLink
) {}
