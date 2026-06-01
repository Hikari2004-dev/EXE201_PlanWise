package com.exe201.planwise.habit.controller;

import com.exe201.planwise.habit.dto.*;
import com.exe201.planwise.habit.service.HabitService;
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
@RequestMapping("/api/v1/habits")
@RequiredArgsConstructor
public class HabitController {

    private final HabitService habitService;

    /**
     * GET /api/v1/habits
     * Lấy tất cả thói quen của người dùng.
     */
    @GetMapping
    public ResponseEntity<HabitListResponse> getHabits(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(habitService.getHabits(principal.getId()));
    }

    /**
     * GET /api/v1/habits/active
     * Lấy các thói quen đang hoạt động.
     */
    @GetMapping("/active")
    public ResponseEntity<List<HabitDto>> getActiveHabits(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(habitService.getActiveHabits(principal.getId()));
    }

    /**
     * GET /api/v1/habits/{habitId}
     * Lấy chi tiết một thói quen.
     */
    @GetMapping("/{habitId}")
    public ResponseEntity<HabitDto> getHabitById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID habitId) {
        return ResponseEntity.ok(habitService.getHabitById(principal.getId(), habitId));
    }

    /**
     * POST /api/v1/habits
     * Tạo thói quen mới.
     * FREE: giới hạn 3 habits. PREMIUM: không giới hạn.
     */
    @PostMapping
    public ResponseEntity<HabitDto> createHabit(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateHabitRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(habitService.createHabit(principal.getId(), request));
    }

    /**
     * PUT /api/v1/habits/{habitId}
     * Cập nhật thói quen.
     */
    @PutMapping("/{habitId}")
    public ResponseEntity<HabitDto> updateHabit(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID habitId,
            @Valid @RequestBody UpdateHabitRequest request) {
        return ResponseEntity.ok(habitService.updateHabit(principal.getId(), habitId, request));
    }

    /**
     * DELETE /api/v1/habits/{habitId}
     * Xóa thói quen.
     */
    @DeleteMapping("/{habitId}")
    public ResponseEntity<Void> deleteHabit(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID habitId) {
        habitService.deleteHabit(principal.getId(), habitId);
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/v1/habits/{habitId}/toggle
     * Toggle hoàn thành thói quen trong một ngày.
     */
    @PostMapping("/{habitId}/toggle")
    public ResponseEntity<HabitDto> toggleCompletion(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID habitId,
            @Valid @RequestBody ToggleHabitCompletionRequest request) {
        return ResponseEntity.ok(habitService.toggleCompletion(principal.getId(), habitId, request.date()));
    }

    /**
     * POST /api/v1/habits/{habitId}/complete
     * Đánh dấu hoàn thành thói quen trong một ngày.
     */
    @PostMapping("/{habitId}/complete")
    public ResponseEntity<HabitDto> markCompleted(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID habitId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(habitService.markCompleted(principal.getId(), habitId, date));
    }

    /**
     * DELETE /api/v1/habits/{habitId}/complete
     * Bỏ đánh dấu hoàn thành thói quen trong một ngày.
     */
    @DeleteMapping("/{habitId}/complete")
    public ResponseEntity<HabitDto> unmarkCompleted(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID habitId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(habitService.unmarkCompleted(principal.getId(), habitId, date));
    }
}
