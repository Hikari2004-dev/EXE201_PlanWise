package com.exe201.planwise.integration.calendar.model;

import java.time.LocalDate;

/** Provider-neutral event fields used when editing an external calendar event. */
public record ExternalCalendarEventUpdate(
        String title,
        LocalDate eventDate,
        int startHour,
        int startMin,
        double duration,
        String location,
        String notes,
        boolean allDay,
        boolean recurring,
        String recurrenceRule
) {}
