package com.exe201.planwise.integration.calendar.controller;

import com.exe201.planwise.integration.calendar.dto.CalendarIntegrationStatus;
import com.exe201.planwise.integration.calendar.dto.CalendarSyncResponse;
import com.exe201.planwise.integration.calendar.dto.UpdateExternalCalendarEventRequest;
import com.exe201.planwise.integration.calendar.service.CalendarIntegrationService;
import com.exe201.planwise.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/v1/calendar-integrations")
@RequiredArgsConstructor
public class CalendarIntegrationController {

    private final CalendarIntegrationService integrationService;

    @GetMapping
    public ResponseEntity<List<CalendarIntegrationStatus>> getStatuses(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(integrationService.getStatuses(principal.getId()));
    }

    @PostMapping("/{provider}/sync")
    public ResponseEntity<CalendarSyncResponse> synchronizeAll(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String provider) {
        return ResponseEntity.ok(integrationService.synchronizeAll(principal.getId(), provider));
    }

    @PutMapping("/{provider}/events")
    public ResponseEntity<Void> updateExternalEvent(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String provider,
            @Valid @RequestBody UpdateExternalCalendarEventRequest request) {
        integrationService.updateExternalEvent(principal.getId(), provider, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{provider}/events")
    public ResponseEntity<Void> deleteExternalEvent(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String provider,
            @RequestParam String externalCalendarId,
            @RequestParam String externalEventId) {
        integrationService.deleteExternalEvent(
                principal.getId(), provider, externalCalendarId, externalEventId);
        return ResponseEntity.noContent().build();
    }
}
