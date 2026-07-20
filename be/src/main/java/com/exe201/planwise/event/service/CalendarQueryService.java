package com.exe201.planwise.event.service;

import com.exe201.planwise.event.dto.CalendarEventDto;
import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import com.exe201.planwise.integration.calendar.service.CalendarIntegrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CalendarQueryService {

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final CalendarEventService internalEventService;
    private final CalendarIntegrationService integrationService;

    public List<CalendarEventDto> getEvents(
            UUID userId,
            LocalDate date,
            LocalDate startDate,
            LocalDate endDate) {
        if ((startDate == null) != (endDate == null)) {
            throw new AppException(
                    ErrorCode.BAD_REQUEST,
                    "startDate and endDate must be provided together"
            );
        }

        LocalDate externalStart;
        LocalDate externalEnd;
        List<CalendarEventDto> internalEvents;
        if (date != null) {
            externalStart = date;
            externalEnd = date;
            internalEvents = internalEventService.getEventsByDate(userId, date);
        } else if (startDate != null) {
            if (endDate.isBefore(startDate)) {
                throw new AppException(ErrorCode.BAD_REQUEST, "endDate must not be before startDate");
            }
            externalStart = startDate;
            externalEnd = endDate;
            internalEvents = internalEventService.getEventsByDateRange(userId, startDate, endDate);
        } else {
            LocalDate today = LocalDate.now(DEFAULT_ZONE);
            externalStart = today.minusDays(90);
            externalEnd = today.plusYears(1);
            internalEvents = internalEventService.getEvents(userId);
        }

        List<CalendarEventDto> result = new ArrayList<>(internalEvents);
        integrationService.getExternalEvents(userId, externalStart, externalEnd).stream()
                .map(CalendarEventDto::from)
                .forEach(result::add);
        result.sort(Comparator
                .comparing(CalendarEventDto::eventDate)
                .thenComparingInt(CalendarEventDto::startHour)
                .thenComparingInt(CalendarEventDto::startMin)
                .thenComparing(CalendarEventDto::title));
        return result;
    }
}
