package com.exe201.planwise.integration.calendar.service;

import com.exe201.planwise.event.repository.CalendarEventRepository;
import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import com.exe201.planwise.integration.calendar.dto.UpdateExternalCalendarEventRequest;
import com.exe201.planwise.integration.calendar.model.ExternalCalendarEventUpdate;
import com.exe201.planwise.integration.calendar.model.ExternalEventReference;
import com.exe201.planwise.integration.calendar.provider.CalendarProviderException;
import com.exe201.planwise.integration.calendar.provider.ExternalCalendarProvider;
import com.exe201.planwise.integration.calendar.repository.CalendarConnectionRepository;
import com.exe201.planwise.integration.calendar.repository.CalendarEventMappingRepository;
import com.exe201.planwise.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CalendarIntegrationServiceTest {

    @Mock
    private CalendarConnectionRepository connectionRepository;
    @Mock
    private CalendarEventMappingRepository mappingRepository;
    @Mock
    private CalendarEventRepository eventRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ExternalCalendarProvider provider;

    private CalendarIntegrationService service;
    private UUID userId;

    @BeforeEach
    void setUp() {
        when(provider.providerKey()).thenReturn("google");
        userId = UUID.randomUUID();
        service = new CalendarIntegrationService(
                connectionRepository,
                mappingRepository,
                eventRepository,
                userRepository,
                List.of(provider)
        );
    }

    @Test
    void updateExternalEventForwardsGoogleIdsAndNormalizesAllDayDuration() {
        when(provider.isConnected(userId)).thenReturn(true);
        when(provider.updateEvent(eq(userId), eq("calendar-id"), eq("event-id"), any()))
                .thenReturn(new ExternalEventReference("event-id", "etag"));
        UpdateExternalCalendarEventRequest request = request(true, 0);

        service.updateExternalEvent(userId, "google", request);

        ArgumentCaptor<ExternalCalendarEventUpdate> updateCaptor =
                ArgumentCaptor.forClass(ExternalCalendarEventUpdate.class);
        verify(provider).updateEvent(
                eq(userId), eq("calendar-id"), eq("event-id"), updateCaptor.capture());
        ExternalCalendarEventUpdate update = updateCaptor.getValue();
        assertThat(update.title()).isEqualTo("Planning session");
        assertThat(update.allDay()).isTrue();
        assertThat(update.duration()).isEqualTo(24.0);
    }

    @Test
    void deleteExternalEventForwardsGoogleIds() {
        when(provider.isConnected(userId)).thenReturn(true);

        service.deleteExternalEvent(userId, "google", "calendar-id", "event-id");

        verify(provider).deleteEvent(userId, "calendar-id", "event-id");
    }

    @Test
    void updateExternalEventDoesNotExposeRawProviderFailure() {
        when(provider.isConnected(userId)).thenReturn(true);
        doThrow(new CalendarProviderException("HTTP 403 raw response"))
                .when(provider)
                .updateEvent(eq(userId), eq("calendar-id"), eq("event-id"), any());

        assertThatThrownBy(() -> service.updateExternalEvent(userId, "google", request(false, 1)))
                .isInstanceOfSatisfying(AppException.class, exception -> {
                    assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.CALENDAR_EVENT_UPDATE_FAILED);
                    assertThat(exception.getMessage()).doesNotContain("HTTP 403");
                });
    }

    private UpdateExternalCalendarEventRequest request(boolean allDay, double duration) {
        return new UpdateExternalCalendarEventRequest(
                "calendar-id",
                "event-id",
                "Planning session",
                LocalDate.of(2026, 7, 21),
                9,
                30,
                duration,
                "Room A",
                "Notes",
                allDay,
                false,
                null
        );
    }
}
