package com.exe201.planwise.integration.calendar.service;

import com.exe201.planwise.event.entity.CalendarEvent;
import com.exe201.planwise.event.repository.CalendarEventRepository;
import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import com.exe201.planwise.integration.calendar.dto.CalendarIntegrationStatus;
import com.exe201.planwise.integration.calendar.dto.CalendarSyncResponse;
import com.exe201.planwise.integration.calendar.dto.UpdateExternalCalendarEventRequest;
import com.exe201.planwise.integration.calendar.entity.CalendarConnection;
import com.exe201.planwise.integration.calendar.entity.CalendarEventMapping;
import com.exe201.planwise.integration.calendar.model.ExternalCalendarDescriptor;
import com.exe201.planwise.integration.calendar.model.ExternalCalendarEvent;
import com.exe201.planwise.integration.calendar.model.ExternalCalendarEventUpdate;
import com.exe201.planwise.integration.calendar.model.ExternalEventReference;
import com.exe201.planwise.integration.calendar.provider.ExternalCalendarProvider;
import com.exe201.planwise.integration.calendar.repository.CalendarConnectionRepository;
import com.exe201.planwise.integration.calendar.repository.CalendarEventMappingRepository;
import com.exe201.planwise.user.entity.User;
import com.exe201.planwise.user.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@Slf4j
public class CalendarIntegrationService {

    private final CalendarConnectionRepository connectionRepository;
    private final CalendarEventMappingRepository mappingRepository;
    private final CalendarEventRepository eventRepository;
    private final UserRepository userRepository;
    private final Map<String, ExternalCalendarProvider> providers;

    public CalendarIntegrationService(
            CalendarConnectionRepository connectionRepository,
            CalendarEventMappingRepository mappingRepository,
            CalendarEventRepository eventRepository,
            UserRepository userRepository,
            List<ExternalCalendarProvider> providerList) {
        this.connectionRepository = connectionRepository;
        this.mappingRepository = mappingRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.providers = new HashMap<>();
        providerList.forEach(provider -> providers.put(provider.providerKey(), provider));
    }

    public List<ExternalCalendarEvent> getExternalEvents(
            UUID userId,
            LocalDate startDate,
            LocalDate endDate) {
        List<ExternalCalendarEvent> events = new ArrayList<>();
        for (ExternalCalendarProvider provider : providers.values()) {
            if (!provider.isConnected(userId)) {
                continue;
            }
            try {
                CalendarConnection connection = ensureConnection(userId, provider);
                events.addAll(provider.listEvents(
                        userId,
                        startDate,
                        endDate,
                        Set.of(connection.getExternalCalendarId())
                ));
            } catch (RuntimeException exception) {
                String diagnostic = diagnosticMessage(exception);
                log.warn("Unable to load {} calendar events for user {}: {}",
                        provider.providerKey(), userId, diagnostic);
                log.debug("Google Calendar event read failure", exception);
            }
        }
        return events;
    }

    public List<CalendarIntegrationStatus> getStatuses(UUID userId) {
        return providers.values().stream()
                .map(provider -> getStatus(userId, provider))
                .toList();
    }

    private CalendarIntegrationStatus getStatus(
            UUID userId,
            ExternalCalendarProvider provider) {
        boolean connected = provider.isConnected(userId);
        CalendarConnection connection = null;
        try {
            connection = connectionRepository
                    .findByUserIdAndProvider(userId, provider.providerKey())
                    .orElse(null);
            if (!connected) {
                return new CalendarIntegrationStatus(
                        provider.providerKey(),
                        false,
                        connection == null ? null : connection.getExternalCalendarId(),
                        connection == null ? null : connection.getDisplayName(),
                        "DISCONNECTED",
                        null
                );
            }

            connection = ensureConnection(userId, provider);
            LocalDate today = LocalDate.now();
            provider.listEvents(
                    userId,
                    today,
                    today,
                    Set.of(connection.getExternalCalendarId())
            );
            return new CalendarIntegrationStatus(
                    provider.providerKey(),
                    true,
                    connection.getExternalCalendarId(),
                    connection.getDisplayName(),
                    "READY",
                    null
            );
        } catch (RuntimeException exception) {
            String diagnostic = diagnosticMessage(exception);
            log.warn("Unable to verify {} calendar connection for user {}: {}",
                    provider.providerKey(), userId, diagnostic);
            log.debug("Google Calendar connection verification failure", exception);
            return new CalendarIntegrationStatus(
                    provider.providerKey(),
                    connected,
                    connection == null ? null : connection.getExternalCalendarId(),
                    connection == null ? null : connection.getDisplayName(),
                    "ERROR",
                    truncate(diagnostic, 500)
            );
        }
    }

    public void synchronizeEvent(UUID userId, CalendarEvent event) {
        for (ExternalCalendarProvider provider : providers.values()) {
            if (!provider.isConnected(userId)) {
                continue;
            }
            SyncAttempt result = synchronizeEvent(userId, event, provider);
            if (!result.success()) {
                log.warn("Unable to synchronize event {} with {}: {}",
                        event.getId(), provider.providerKey(), result.error());
            }
        }
    }

    public void deleteSynchronizedEvent(UUID userId, UUID internalEventId) {
        List<String> errors = new ArrayList<>();
        for (CalendarEventMapping mapping : mappingRepository.findByInternalEventId(internalEventId)) {
            CalendarConnection connection = mapping.getConnection();
            ExternalCalendarProvider provider = providers.get(connection.getProvider());
            if (provider == null || !provider.isConnected(userId)) {
                continue;
            }
            try {
                provider.deleteEvent(
                        userId,
                        connection.getExternalCalendarId(),
                        mapping.getExternalEventId()
                );
                mappingRepository.delete(mapping);
            } catch (RuntimeException exception) {
                mapping.setSyncStatus(CalendarEventMapping.SyncStatus.FAILED);
                mapping.setLastError(truncate(exception.getMessage(), 2000));
                mappingRepository.save(mapping);
                errors.add(connection.getProvider() + ": " + exception.getMessage());
                log.warn("Unable to delete synchronized {} event {}: {}",
                        connection.getProvider(), mapping.getExternalEventId(), exception.getMessage());
            }
        }
        if (!errors.isEmpty()) {
            throw new AppException(ErrorCode.CALENDAR_SYNC_FAILED, String.join("; ", errors));
        }
    }

    public CalendarSyncResponse synchronizeAll(UUID userId, String providerKey) {
        ExternalCalendarProvider provider = providers.get(providerKey);
        if (provider == null) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Calendar provider is not supported: " + providerKey);
        }
        if (!provider.isConnected(userId)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Calendar provider is not connected: " + providerKey);
        }

        List<CalendarEvent> internalEvents = eventRepository
                .findByUserIdOrderByEventDateAscStartHourAsc(userId);
        int synchronizedCount = 0;
        List<String> errors = new ArrayList<>();
        for (CalendarEvent event : internalEvents) {
            SyncAttempt attempt = synchronizeEvent(userId, event, provider);
            if (attempt.success()) {
                synchronizedCount++;
            } else {
                errors.add(event.getId() + ": " + attempt.error());
            }
        }
        return new CalendarSyncResponse(
                providerKey,
                internalEvents.size(),
                synchronizedCount,
                errors.size(),
                errors
        );
    }

    public void updateExternalEvent(
            UUID userId,
            String providerKey,
            UpdateExternalCalendarEventRequest request) {
        ExternalCalendarProvider provider = requireProvider(providerKey);
        requireConnected(provider, userId);
        ExternalCalendarEventUpdate update = toExternalEventUpdate(request);
        try {
            provider.updateEvent(
                    userId,
                    request.externalCalendarId(),
                    request.externalEventId(),
                    update
            );
        } catch (RuntimeException exception) {
            log.warn("Unable to update Google event {} for user {}: {}",
                    request.externalEventId(), userId, diagnosticMessage(exception));
            throw new AppException(ErrorCode.CALENDAR_EVENT_UPDATE_FAILED);
        }
    }

    public void deleteExternalEvent(
            UUID userId,
            String providerKey,
            String externalCalendarId,
            String externalEventId) {
        ExternalCalendarProvider provider = requireProvider(providerKey);
        requireConnected(provider, userId);
        if (externalCalendarId == null || externalCalendarId.isBlank()
                || externalEventId == null || externalEventId.isBlank()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Calendar ID và Event ID là bắt buộc");
        }
        try {
            provider.deleteEvent(userId, externalCalendarId, externalEventId);
        } catch (RuntimeException exception) {
            log.warn("Unable to delete Google event {} for user {}: {}",
                    externalEventId, userId, diagnosticMessage(exception));
            throw new AppException(ErrorCode.CALENDAR_EVENT_DELETE_FAILED);
        }
    }

    private ExternalCalendarProvider requireProvider(String providerKey) {
        ExternalCalendarProvider provider = providers.get(providerKey);
        if (provider == null) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Calendar provider is not supported: " + providerKey);
        }
        return provider;
    }

    private void requireConnected(ExternalCalendarProvider provider, UUID userId) {
        if (!provider.isConnected(userId)) {
            throw new AppException(ErrorCode.CALENDAR_INTEGRATION_NOT_CONNECTED);
        }
    }

    private ExternalCalendarEventUpdate toExternalEventUpdate(UpdateExternalCalendarEventRequest request) {
        if (request.eventDate() == null || request.title() == null || request.title().isBlank()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Tiêu đề và ngày sự kiện là bắt buộc");
        }
        if (request.startHour() < 0 || request.startHour() > 23
                || request.startMin() < 0 || request.startMin() > 59) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Thời gian sự kiện không hợp lệ");
        }
        if (!request.allDay() && request.duration() <= 0) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Thời lượng sự kiện phải lớn hơn 0");
        }
        double duration = request.allDay()
                ? Math.max(24.0, request.duration())
                : request.duration();
        return new ExternalCalendarEventUpdate(
                request.title().trim(),
                request.eventDate(),
                request.startHour(),
                request.startMin(),
                duration,
                request.location(),
                request.notes(),
                request.allDay(),
                request.isRecurring(),
                request.recurrenceRule()
        );
    }

    private SyncAttempt synchronizeEvent(
            UUID userId,
            CalendarEvent event,
            ExternalCalendarProvider provider) {
        CalendarConnection connection;
        CalendarEventMapping mapping = null;
        try {
            connection = ensureConnection(userId, provider);
            mapping = mappingRepository
                    .findByConnectionIdAndInternalEventId(connection.getId(), event.getId())
                    .orElse(null);
            ExternalEventReference reference = provider.upsertEvent(
                    userId,
                    connection.getExternalCalendarId(),
                    mapping == null ? null : mapping.getExternalEventId(),
                    event
            );

            if (mapping == null) {
                mapping = CalendarEventMapping.builder()
                        .connection(connection)
                        .internalEvent(event)
                        .externalEventId(reference.eventId())
                        .build();
            }
            mapping.setExternalEventId(reference.eventId());
            mapping.setExternalEtag(reference.etag());
            mapping.setSyncStatus(CalendarEventMapping.SyncStatus.SYNCED);
            mapping.setLastSyncedAt(OffsetDateTime.now());
            mapping.setLastError(null);
            mappingRepository.save(mapping);
            return new SyncAttempt(true, null);
        } catch (RuntimeException exception) {
            if (mapping != null) {
                mapping.setSyncStatus(CalendarEventMapping.SyncStatus.FAILED);
                mapping.setLastError(truncate(exception.getMessage(), 2000));
                mappingRepository.save(mapping);
            }
            return new SyncAttempt(false, exception.getMessage());
        }
    }

    private CalendarConnection ensureConnection(UUID userId, ExternalCalendarProvider provider) {
        CalendarConnection existing = connectionRepository
                .findByUserIdAndProvider(userId, provider.providerKey())
                .orElse(null);
        ExternalCalendarDescriptor descriptor = provider.ensureApplicationCalendar(
                userId,
                existing == null ? null : existing.getExternalCalendarId()
        );

        if (existing != null) {
            existing.setExternalCalendarId(descriptor.id());
            existing.setDisplayName(descriptor.displayName());
            return connectionRepository.save(existing);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return connectionRepository.save(CalendarConnection.builder()
                .user(user)
                .provider(provider.providerKey())
                .externalCalendarId(descriptor.id())
                .displayName(descriptor.displayName())
                .build());
    }

    private String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }

    private String diagnosticMessage(Throwable exception) {
        String message = exception.getMessage();
        Throwable rootCause = exception;
        while (rootCause.getCause() != null && rootCause.getCause() != rootCause) {
            rootCause = rootCause.getCause();
        }
        String rootMessage = rootCause.getMessage();
        if (rootMessage == null || rootMessage.isBlank() || rootMessage.equals(message)) {
            return message == null || message.isBlank()
                    ? exception.getClass().getSimpleName()
                    : message;
        }
        return (message == null || message.isBlank() ? exception.getClass().getSimpleName() : message)
                + " | cause: " + rootMessage;
    }

    private record SyncAttempt(boolean success, String error) {}
}
