package com.exe201.planwise.integration.calendar.dto;

public record CalendarIntegrationStatus(
        String provider,
        boolean connected,
        String applicationCalendarId,
        String applicationCalendarName,
        String state,
        String message
) {}
