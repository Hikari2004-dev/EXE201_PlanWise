package com.exe201.planwise.focus.controller;

import com.exe201.planwise.focus.dto.*;
import com.exe201.planwise.focus.service.FocusService;
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
@RequestMapping("/api/v1/focus")
@RequiredArgsConstructor
public class FocusController {

    private final FocusService focusService;

    @GetMapping("/sessions")
    public ResponseEntity<List<FocusSessionDto>> getFocusSessions(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(focusService.getFocusSessions(principal.getId()));
    }

    @PostMapping("/sessions")
    public ResponseEntity<FocusSessionDto> createFocusSession(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateFocusSessionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(focusService.createFocusSession(principal.getId(), request));
    }

    @PostMapping("/sessions/{sessionId}/complete")
    public ResponseEntity<FocusSessionDto> completeFocusSession(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID sessionId) {
        return ResponseEntity.ok(focusService.completeFocusSession(principal.getId(), sessionId));
    }

    @GetMapping("/daily")
    public ResponseEntity<DailyFocusDto> getDailyFocus(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) date = LocalDate.now();
        return ResponseEntity.ok(focusService.getDailyFocus(principal.getId(), date));
    }

    @PostMapping("/daily/top-tasks")
    public ResponseEntity<DailyFocusDto> addTopTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam UUID taskId) {
        return ResponseEntity.ok(focusService.addTopTask(principal.getId(), date, taskId));
    }

    @DeleteMapping("/daily/top-tasks")
    public ResponseEntity<DailyFocusDto> removeTopTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam UUID taskId) {
        return ResponseEntity.ok(focusService.removeTopTask(principal.getId(), date, taskId));
    }

    @PutMapping("/daily/notes")
    public ResponseEntity<DailyFocusDto> updateDailyNotes(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestBody String notes) {
        return ResponseEntity.ok(focusService.updateDailyNotes(principal.getId(), date, notes));
    }

    @GetMapping("/notes")
    public ResponseEntity<List<QuickNoteDto>> getQuickNotes(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(focusService.getQuickNotes(principal.getId()));
    }

    @PostMapping("/notes")
    public ResponseEntity<QuickNoteDto> createQuickNote(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateQuickNoteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(focusService.createQuickNote(principal.getId(), request));
    }

    @DeleteMapping("/notes/{noteId}")
    public ResponseEntity<Void> deleteQuickNote(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID noteId) {
        focusService.deleteQuickNote(principal.getId(), noteId);
        return ResponseEntity.noContent().build();
    }
}
