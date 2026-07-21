package com.exe201.planwise.integration.calendar.google;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.exe201.planwise.auth.oauth.OAuthAccessTokenService;
import com.exe201.planwise.event.entity.CalendarEvent;
import com.exe201.planwise.integration.calendar.model.ExternalCalendarDescriptor;
import com.exe201.planwise.integration.calendar.model.ExternalCalendarEvent;
import com.exe201.planwise.integration.calendar.model.ExternalCalendarEventUpdate;
import com.exe201.planwise.integration.calendar.model.ExternalEventReference;
import com.exe201.planwise.integration.calendar.provider.CalendarProviderException;
import com.exe201.planwise.integration.calendar.provider.ExternalCalendarProvider;
import com.exe201.planwise.user.repository.OauthProviderRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import lombok.extern.slf4j.Slf4j;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Component
@Slf4j
public class GoogleCalendarProvider implements ExternalCalendarProvider {

    public static final String PROVIDER = "google";
    private static final String APPLICATION_CALENDAR_NAME = "PlanWise";
    private static final String APPLICATION_CALENDAR_MARKER =
            "Managed by PlanWise. Application events are synchronized here.";
    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter GOOGLE_DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("uuuu-MM-dd'T'HH:mm:ssXXX");

    private final OAuthAccessTokenService accessTokenService;
    private final OauthProviderRepository oauthProviderRepository;
    private final RestClient restClient;

    public GoogleCalendarProvider(
            OAuthAccessTokenService accessTokenService,
            OauthProviderRepository oauthProviderRepository) {
        this.accessTokenService = accessTokenService;
        this.oauthProviderRepository = oauthProviderRepository;
        this.restClient = RestClient.builder()
                .baseUrl("https://www.googleapis.com/calendar/v3")
                .build();
    }

    @Override
    public String providerKey() {
        return PROVIDER;
    }

    @Override
    public boolean isConnected(UUID userId) {
        return oauthProviderRepository.findByProviderAndUserId(PROVIDER, userId)
                .filter(provider -> StringUtils.hasText(provider.getAccessToken())
                        || StringUtils.hasText(provider.getRefreshToken()))
                .isPresent();
    }

    @Override
    public ExternalCalendarDescriptor ensureApplicationCalendar(UUID userId, String existingCalendarId) {
        String accessToken = requireAccessToken(userId);

        if (StringUtils.hasText(existingCalendarId)) {
            try {
                GoogleCalendar calendar = restClient.get()
                        .uri(uriBuilder -> uriBuilder.pathSegment("calendars", existingCalendarId).build())
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .retrieve()
                        .body(GoogleCalendar.class);
                if (calendar != null && StringUtils.hasText(calendar.id())) {
                    return new ExternalCalendarDescriptor(
                            calendar.id(),
                            defaultIfBlank(calendar.summary(), APPLICATION_CALENDAR_NAME)
                    );
                }
            } catch (RestClientResponseException exception) {
                if (exception.getStatusCode().value() != 404
                        && exception.getStatusCode().value() != 410) {
                    throw providerFailure("verify the PlanWise calendar", exception);
                }
            }
        }

        for (GoogleCalendarListEntry calendar : listCalendars(accessToken)) {
            if (APPLICATION_CALENDAR_MARKER.equals(calendar.description())
                    && "owner".equalsIgnoreCase(calendar.accessRole())) {
                return new ExternalCalendarDescriptor(
                        calendar.id(),
                        defaultIfBlank(calendar.summary(), APPLICATION_CALENDAR_NAME)
                );
            }
        }

        Map<String, Object> request = new LinkedHashMap<>();
        request.put("summary", APPLICATION_CALENDAR_NAME);
        request.put("description", APPLICATION_CALENDAR_MARKER);
        request.put("timeZone", DEFAULT_ZONE.getId());

        try {
            GoogleCalendar calendar = restClient.post()
                    .uri("/calendars")
                    .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                    .body(request)
                    .retrieve()
                    .body(GoogleCalendar.class);
            if (calendar == null || !StringUtils.hasText(calendar.id())) {
                throw new CalendarProviderException("Google returned an empty calendar response");
            }
            return new ExternalCalendarDescriptor(
                    calendar.id(),
                    defaultIfBlank(calendar.summary(), APPLICATION_CALENDAR_NAME)
            );
        } catch (RestClientResponseException exception) {
            throw providerFailure("create the PlanWise calendar", exception);
        }
    }

    @Override
    public List<ExternalCalendarEvent> listEvents(
            UUID userId,
            LocalDate startDate,
            LocalDate endDate,
            Set<String> excludedCalendarIds) {
        String accessToken = requireAccessToken(userId);
        List<ExternalCalendarEvent> events = new ArrayList<>();
        RuntimeException firstFailure = null;
        int attemptedCalendars = 0;
        int failedCalendars = 0;

        for (GoogleCalendarListEntry calendar : listCalendars(accessToken)) {
            if (excludedCalendarIds.contains(calendar.id())) {
                continue;
            }
            attemptedCalendars++;
            try {
                events.addAll(listCalendarEvents(accessToken, calendar, startDate, endDate));
            } catch (RuntimeException exception) {
                failedCalendars++;
                if (firstFailure == null) {
                    firstFailure = exception;
                }
                log.warn("Unable to read Google calendar {}: {}",
                        calendar.summary(), exception.getMessage());
            }
        }
        if (attemptedCalendars > 0 && failedCalendars == attemptedCalendars) {
            throw firstFailure == null
                    ? new CalendarProviderException("Unable to read Google Calendar events")
                    : firstFailure;
        }
        return events;
    }

    @Override
    public ExternalEventReference upsertEvent(
            UUID userId,
            String calendarId,
            String externalEventId,
            CalendarEvent event) {
        String accessToken = requireAccessToken(userId);
        String resolvedEventId = externalEventId;
        if (!StringUtils.hasText(resolvedEventId)) {
            resolvedEventId = findEventByInternalId(accessToken, calendarId, event.getId());
        }

        Map<String, Object> payload = eventPayload(event);
        try {
            GoogleEvent response;
            if (StringUtils.hasText(resolvedEventId)) {
                try {
                    response = updateEvent(accessToken, calendarId, resolvedEventId, payload);
                } catch (RestClientResponseException exception) {
                    int status = exception.getStatusCode().value();
                    if (status != 404 && status != 410) {
                        throw exception;
                    }
                    response = createEvent(accessToken, calendarId, payload);
                }
            } else {
                response = createEvent(accessToken, calendarId, payload);
            }
            if (response == null || !StringUtils.hasText(response.id())) {
                throw new CalendarProviderException("Google returned an empty event response");
            }
            return new ExternalEventReference(response.id(), response.etag());
        } catch (RestClientResponseException exception) {
            throw providerFailure("synchronize an event", exception);
        }
    }

    @Override
    public ExternalEventReference updateEvent(
            UUID userId,
            String calendarId,
            String externalEventId,
            ExternalCalendarEventUpdate update) {
        String accessToken = requireAccessToken(userId);
        try {
            GoogleEvent response = updateEvent(
                    accessToken,
                    calendarId,
                    externalEventId,
                    eventPayload(update)
            );
            if (response == null || !StringUtils.hasText(response.id())) {
                throw new CalendarProviderException("Google returned an empty event response");
            }
            return new ExternalEventReference(response.id(), response.etag());
        } catch (RestClientResponseException exception) {
            throw providerFailure("update an event", exception);
        }
    }

    @Override
    public void deleteEvent(UUID userId, String calendarId, String externalEventId) {
        String accessToken = requireAccessToken(userId);
        try {
            restClient.delete()
                    .uri(uriBuilder -> uriBuilder
                            .pathSegment("calendars", calendarId, "events", externalEventId)
                            .build())
                    .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException exception) {
            int status = exception.getStatusCode().value();
            if (status != 404 && status != 410) {
                throw providerFailure("delete an event", exception);
            }
        }
    }

    private List<GoogleCalendarListEntry> listCalendars(String accessToken) {
        List<GoogleCalendarListEntry> calendars = new ArrayList<>();
        String pageToken = null;
        do {
            String currentPageToken = pageToken;
            try {
                GoogleCalendarListResponse response = restClient.get()
                        .uri(uriBuilder -> {
                            var builder = uriBuilder.path("/users/me/calendarList")
                                    .queryParam("minAccessRole", "reader")
                                    .queryParam("showDeleted", false)
                                    .queryParam("showHidden", false)
                                    .queryParam("maxResults", 250);
                            if (StringUtils.hasText(currentPageToken)) {
                                builder.queryParam("pageToken", currentPageToken);
                            }
                            return builder.build();
                        })
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .retrieve()
                        .body(GoogleCalendarListResponse.class);
                if (response == null) {
                    break;
                }
                if (response.items() != null) {
                    calendars.addAll(response.items());
                }
                pageToken = response.nextPageToken();
            } catch (RestClientResponseException exception) {
                throw providerFailure("list calendars", exception);
            }
        } while (StringUtils.hasText(pageToken));
        return calendars;
    }

    private List<ExternalCalendarEvent> listCalendarEvents(
            String accessToken,
            GoogleCalendarListEntry calendar,
            LocalDate startDate,
            LocalDate endDate) {
        List<ExternalCalendarEvent> events = new ArrayList<>();
        String pageToken = null;
        String timeMin = formatGoogleDateTime(
                startDate.atStartOfDay(DEFAULT_ZONE).withZoneSameInstant(ZoneOffset.UTC)
        );
        String timeMax = formatGoogleDateTime(
                endDate.plusDays(1).atStartOfDay(DEFAULT_ZONE).withZoneSameInstant(ZoneOffset.UTC)
        );

        do {
            String currentPageToken = pageToken;
            try {
                GoogleEventListResponse response = restClient.get()
                        .uri(uriBuilder -> {
                            var builder = uriBuilder
                                    .pathSegment("calendars", calendar.id(), "events")
                                    .queryParam("timeMin", timeMin)
                                    .queryParam("timeMax", timeMax)
                                    .queryParam("singleEvents", true)
                                    .queryParam("orderBy", "startTime")
                                    .queryParam("showDeleted", false)
                                    .queryParam("maxResults", 2500);
                            if (StringUtils.hasText(currentPageToken)) {
                                builder.queryParam("pageToken", currentPageToken);
                            }
                            return builder.build();
                        })
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .retrieve()
                        .body(GoogleEventListResponse.class);
                if (response == null) {
                    break;
                }
                if (response.items() != null) {
                    response.items().stream()
                            .filter(event -> !"cancelled".equalsIgnoreCase(event.status()))
                            .forEach(event -> {
                                try {
                                    events.add(toExternalEvent(calendar, event));
                                } catch (RuntimeException exception) {
                                    log.warn("Skipping malformed Google event {} from calendar {}: {}",
                                            event.id(), calendar.summary(), exception.getMessage());
                                }
                            });
                }
                pageToken = response.nextPageToken();
            } catch (RestClientResponseException exception) {
                throw providerFailure("list events for calendar " + calendar.summary(), exception);
            }
        } while (StringUtils.hasText(pageToken));
        return events;
    }

    private ExternalCalendarEvent toExternalEvent(GoogleCalendarListEntry calendar, GoogleEvent event) {
        boolean allDay = event.start() != null && StringUtils.hasText(event.start().date());
        LocalDate eventDate;
        int startHour;
        int startMin;
        double duration;

        if (allDay) {
            eventDate = LocalDate.parse(event.start().date());
            startHour = 0;
            startMin = 0;
            LocalDate exclusiveEndDate = event.end() != null && StringUtils.hasText(event.end().date())
                    ? LocalDate.parse(event.end().date())
                    : eventDate.plusDays(1);
            duration = Math.max(1, ChronoUnit.DAYS.between(eventDate, exclusiveEndDate)) * 24.0;
        } else {
            ZonedDateTime start = parseGoogleDateTime(event.start());
            ZonedDateTime end = parseGoogleDateTime(event.end());
            eventDate = start.toLocalDate();
            startHour = start.getHour();
            startMin = start.getMinute();
            duration = Math.max(1.0 / 60.0, Duration.between(start, end).toMinutes() / 60.0);
        }

        return new ExternalCalendarEvent(
                "google:" + calendar.id() + ":" + event.id(),
                calendar.id(),
                event.id(),
                PROVIDER,
                defaultIfBlank(calendar.summary(), "Google Calendar"),
                defaultIfBlank(event.summary(), "Untitled event"),
                eventDate,
                startHour,
                startMin,
                duration,
                event.location(),
                event.description(),
                allDay,
                StringUtils.hasText(event.recurringEventId())
                        || event.recurrence() != null && !event.recurrence().isEmpty(),
                event.htmlLink()
        );
    }

    private ZonedDateTime parseGoogleDateTime(GoogleEventDateTime value) {
        if (value == null || !StringUtils.hasText(value.dateTime())) {
            return ZonedDateTime.now(DEFAULT_ZONE);
        }
        return OffsetDateTime.parse(value.dateTime()).atZoneSameInstant(DEFAULT_ZONE);
    }

    private String findEventByInternalId(String accessToken, String calendarId, UUID internalEventId) {
        try {
            GoogleEventListResponse response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .pathSegment("calendars", calendarId, "events")
                            .queryParam("privateExtendedProperty", "planwiseEventId=" + internalEventId)
                            .queryParam("showDeleted", false)
                            .queryParam("maxResults", 1)
                            .build())
                    .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                    .retrieve()
                    .body(GoogleEventListResponse.class);
            if (response == null || response.items() == null || response.items().isEmpty()) {
                return null;
            }
            return response.items().get(0).id();
        } catch (RestClientResponseException exception) {
            throw providerFailure("find an existing synchronized event", exception);
        }
    }

    private Map<String, Object> eventPayload(CalendarEvent event) {
        Map<String, Object> payload = eventPayload(new ExternalCalendarEventUpdate(
                event.getTitle(),
                event.getEventDate(),
                event.getStartHour(),
                event.getStartMin(),
                event.getDuration(),
                event.getLocation(),
                event.getNotes(),
                false,
                event.isRecurring(),
                event.getRecurrenceRule()
        ));
        payload.put("extendedProperties", Map.of(
                "private", Map.of("planwiseEventId", event.getId().toString())
        ));
        return payload;
    }

    private Map<String, Object> eventPayload(ExternalCalendarEventUpdate event) {
        if (event.eventDate() == null) {
            throw new CalendarProviderException("Event date is required");
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("summary", event.title());
        if (StringUtils.hasText(event.location())) {
            payload.put("location", event.location());
        }
        if (StringUtils.hasText(event.notes())) {
            payload.put("description", event.notes());
        }

        if (event.allDay()) {
            long dayCount = Math.max(1L, (long) Math.ceil(Math.max(24.0, event.duration()) / 24.0));
            payload.put("start", datePayload(event.eventDate()));
            payload.put("end", datePayload(event.eventDate().plusDays(dayCount)));
        } else {
            ZonedDateTime start = ZonedDateTime.of(
                    event.eventDate(),
                    LocalTime.of(event.startHour(), event.startMin()),
                    DEFAULT_ZONE
            );
            long durationMinutes = Math.max(1, Math.round(event.duration() * 60));
            payload.put("start", dateTimePayload(start));
            payload.put("end", dateTimePayload(start.plusMinutes(durationMinutes)));
        }

        String recurrence = normalizeRecurrence(event.recurrenceRule());
        if (event.recurring() && recurrence != null) {
            payload.put("recurrence", List.of(recurrence));
        }
        return payload;
    }

    private Map<String, String> datePayload(LocalDate date) {
        return Map.of("date", date.toString());
    }

    private GoogleEvent createEvent(
            String accessToken,
            String calendarId,
            Map<String, Object> payload) {
        return restClient.post()
                .uri(uriBuilder -> uriBuilder
                        .pathSegment("calendars", calendarId, "events")
                        .build())
                .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                .body(payload)
                .retrieve()
                .body(GoogleEvent.class);
    }

    private GoogleEvent updateEvent(
            String accessToken,
            String calendarId,
            String eventId,
            Map<String, Object> payload) {
        return restClient.put()
                .uri(uriBuilder -> uriBuilder
                        .pathSegment("calendars", calendarId, "events", eventId)
                        .build())
                .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                .body(payload)
                .retrieve()
                .body(GoogleEvent.class);
    }

    private Map<String, String> dateTimePayload(ZonedDateTime dateTime) {
        return Map.of(
                "dateTime", formatGoogleDateTime(dateTime),
                "timeZone", DEFAULT_ZONE.getId()
        );
    }

    static String formatGoogleDateTime(ZonedDateTime dateTime) {
        return GOOGLE_DATE_TIME_FORMATTER.format(dateTime);
    }

    private String normalizeRecurrence(String recurrenceRule) {
        if (!StringUtils.hasText(recurrenceRule)) {
            return null;
        }
        String normalized = recurrenceRule.trim();
        if ("WEEKLY".equalsIgnoreCase(normalized)) {
            return "RRULE:FREQ=WEEKLY";
        }
        if (normalized.regionMatches(true, 0, "RRULE:", 0, 6)) {
            return normalized;
        }
        if (normalized.regionMatches(true, 0, "FREQ=", 0, 5)) {
            return "RRULE:" + normalized;
        }
        return null;
    }

    private String requireAccessToken(UUID userId) {
        return accessTokenService.getAccessToken(userId, PROVIDER)
                .orElseThrow(() -> new CalendarProviderException(
                        "Google Calendar is not connected or requires authorization"
                ));
    }

    private String bearer(String accessToken) {
        return "Bearer " + accessToken;
    }

    private String defaultIfBlank(String value, String fallback) {
        return StringUtils.hasText(value) ? value : fallback;
    }

    private CalendarProviderException providerFailure(String operation, RestClientResponseException exception) {
        return new CalendarProviderException(
                "Unable to " + operation + " using Google Calendar (HTTP "
                        + exception.getStatusCode().value() + ")",
                exception
        );
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record GoogleCalendar(String id, String summary, String description) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record GoogleCalendarListResponse(
            List<GoogleCalendarListEntry> items,
            String nextPageToken
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record GoogleCalendarListEntry(
            String id,
            String summary,
            String description,
            String accessRole,
            String backgroundColor,
            Boolean primary
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record GoogleEventListResponse(
            List<GoogleEvent> items,
            String nextPageToken
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record GoogleEvent(
            String id,
            String etag,
            String status,
            String summary,
            String description,
            String location,
            GoogleEventDateTime start,
            GoogleEventDateTime end,
            List<String> recurrence,
            String recurringEventId,
            String htmlLink
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record GoogleEventDateTime(
            String date,
            String dateTime,
            String timeZone
    ) {}
}
