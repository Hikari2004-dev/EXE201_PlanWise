package com.exe201.planwise.integration.calendar.provider;

import com.exe201.planwise.event.entity.CalendarEvent;
import com.exe201.planwise.integration.calendar.model.ExternalCalendarDescriptor;
import com.exe201.planwise.integration.calendar.model.ExternalCalendarEvent;
import com.exe201.planwise.integration.calendar.model.ExternalCalendarEventUpdate;
import com.exe201.planwise.integration.calendar.model.ExternalEventReference;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface ExternalCalendarProvider {

    String providerKey();

    boolean isConnected(UUID userId);

    ExternalCalendarDescriptor ensureApplicationCalendar(UUID userId, String existingCalendarId);

    List<ExternalCalendarEvent> listEvents(
            UUID userId,
            LocalDate startDate,
            LocalDate endDate,
            Set<String> excludedCalendarIds
    );

    ExternalEventReference upsertEvent(
            UUID userId,
            String calendarId,
            String externalEventId,
            CalendarEvent event
    );

    ExternalEventReference updateEvent(
            UUID userId,
            String calendarId,
            String externalEventId,
            ExternalCalendarEventUpdate update
    );

    void deleteEvent(UUID userId, String calendarId, String externalEventId);
}
