package com.exe201.planwise.integration.calendar.controller;

import com.exe201.planwise.integration.calendar.dto.CalendarIntegrationStatus;
import com.exe201.planwise.integration.calendar.dto.CalendarSyncResponse;
import com.exe201.planwise.integration.calendar.service.CalendarIntegrationService;
import com.exe201.planwise.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
