package com.exe201.planwise.goal.controller;

import com.exe201.planwise.ai.features.goal.dto.CreateGoalFromDraftRequest;
import com.exe201.planwise.goal.dto.*;
import com.exe201.planwise.goal.enums.GoalPeriod;
import com.exe201.planwise.goal.service.GoalService;
import com.exe201.planwise.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/goals")
@RequiredArgsConstructor
public class GoalController {

    private final GoalService goalService;

    /**
     * GET /api/v1/goals
     * Lấy tất cả mục tiêu của người dùng.
     */
    @GetMapping
    public ResponseEntity<GoalListResponse> getGoals(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(goalService.getGoals(principal.getId()));
    }

    /**
     * GET /api/v1/goals?period={week|month|year}
     * Lấy mục tiêu theo kỳ hạn.
     */
    @GetMapping(params = "period")
    public ResponseEntity<List<GoalDto>> getGoalsByPeriod(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam GoalPeriod period) {
        return ResponseEntity.ok(goalService.getGoalsByPeriod(principal.getId(), period));
    }

    /**
     * GET /api/v1/goals/{goalId}
     * Lấy chi tiết một mục tiêu.
     */
    @GetMapping("/{goalId}")
    public ResponseEntity<GoalDto> getGoalById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID goalId) {
        return ResponseEntity.ok(goalService.getGoalById(principal.getId(), goalId));
    }

    /**
     * POST /api/v1/goals
     * Tạo mục tiêu mới.
     * FREE: giới hạn 3 goals. PREMIUM: không giới hạn.
     */
    @PostMapping
    public ResponseEntity<GoalDto> createGoal(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateGoalRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(goalService.createGoal(principal.getId(), request));
    }

    @PostMapping("/create-from-draft")
    public ResponseEntity<GoalDto> createGoalFromDraft(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateGoalFromDraftRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(goalService.createGoalFromDraft(principal.getId(), request));
    }

    /**
     * PUT /api/v1/goals/{goalId}
     * Cập nhật mục tiêu.
     */
    @PutMapping("/{goalId}")
    public ResponseEntity<GoalDto> updateGoal(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID goalId,
            @Valid @RequestBody UpdateGoalRequest request) {
        return ResponseEntity.ok(goalService.updateGoal(principal.getId(), goalId, request));
    }

    /**
     * DELETE /api/v1/goals/{goalId}
     * Xóa mục tiêu.
     */
    @DeleteMapping("/{goalId}")
    public ResponseEntity<Void> deleteGoal(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID goalId) {
        goalService.deleteGoal(principal.getId(), goalId);
        return ResponseEntity.noContent().build();
    }

    /**
     * PATCH /api/v1/goals/{goalId}
     * Cập nhật một phần thông tin mục tiêu (ví dụ: tiến độ).
     */
    @PatchMapping("/{goalId}")
    public ResponseEntity<GoalDto> updateGoalProgress(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID goalId,
            @Valid @RequestBody UpdateGoalRequest request) {
        return ResponseEntity.ok(goalService.updateGoal(principal.getId(), goalId, request));
    }

    // Milestone endpoints

    /**
     * GET /api/v1/goals/{goalId}/milestones
     * Lấy danh sách cột mốc của một mục tiêu.
     */
    @GetMapping("/{goalId}/milestones")
    public ResponseEntity<List<MilestoneDto>> getMilestones(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID goalId) {
        return ResponseEntity.ok(goalService.getMilestones(principal.getId(), goalId));
    }

    /**
     * POST /api/v1/goals/{goalId}/milestones
     * Tạo cột mốc mới cho mục tiêu.
     */
    @PostMapping("/{goalId}/milestones")
    public ResponseEntity<MilestoneDto> createMilestone(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID goalId,
            @Valid @RequestBody CreateMilestoneRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(goalService.createMilestone(principal.getId(), goalId, request));
    }

    /**
     * PUT /api/v1/goals/{goalId}/milestones/{milestoneId}
     * Cập nhật cột mốc.
     */
    @PutMapping("/{goalId}/milestones/{milestoneId}")
    public ResponseEntity<MilestoneDto> updateMilestone(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID goalId,
            @PathVariable UUID milestoneId,
            @Valid @RequestBody UpdateMilestoneRequest request) {
        return ResponseEntity.ok(goalService.updateMilestone(principal.getId(), goalId, milestoneId, request));
    }

    /**
     * DELETE /api/v1/goals/{goalId}/milestones/{milestoneId}
     * Xóa cột mốc.
     */
    @DeleteMapping("/{goalId}/milestones/{milestoneId}")
    public ResponseEntity<Void> deleteMilestone(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID goalId,
            @PathVariable UUID milestoneId) {
        goalService.deleteMilestone(principal.getId(), goalId, milestoneId);
        return ResponseEntity.noContent().build();
    }
}
