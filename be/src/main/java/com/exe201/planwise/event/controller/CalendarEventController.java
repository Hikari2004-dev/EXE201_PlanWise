package com.exe201.planwise.event.controller;

import com.exe201.planwise.event.dto.*;
import com.exe201.planwise.event.service.CalendarEventService;
import com.exe201.planwise.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class CalendarEventController {

    private final CalendarEventService eventService;

    @GetMapping
    public ResponseEntity<List<CalendarEventDto>> getEvents(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        List<CalendarEventDto> events;
        if (date != null) {
            events = eventService.getEventsByDate(principal.getId(), date);
        } else if (startDate != null && endDate != null) {
            events = eventService.getEventsByDateRange(principal.getId(), startDate, endDate);
        } else {
            events = eventService.getEvents(principal.getId());
        }
        return ResponseEntity.ok(events);
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<CalendarEventDto> getEventById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID eventId) {
        return ResponseEntity.ok(eventService.getEventById(principal.getId(), eventId));
    }

    @PostMapping
    public ResponseEntity<CalendarEventDto> createEvent(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateEventRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(eventService.createEvent(principal.getId(), request));
    }

    @PutMapping("/{eventId}")
    public ResponseEntity<CalendarEventDto> updateEvent(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID eventId,
            @Valid @RequestBody UpdateEventRequest request) {
        return ResponseEntity.ok(eventService.updateEvent(principal.getId(), eventId, request));
    }

    @DeleteMapping("/{eventId}")
    public ResponseEntity<Void> deleteEvent(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID eventId) {
        eventService.deleteEvent(principal.getId(), eventId);
        return ResponseEntity.noContent().build();
    }
}
