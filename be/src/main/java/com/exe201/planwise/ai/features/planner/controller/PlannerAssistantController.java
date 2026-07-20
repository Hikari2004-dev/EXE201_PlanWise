package com.exe201.planwise.ai.features.planner.controller;

import com.exe201.planwise.ai.features.planner.dto.ApprovePlannerDraftRequest;
import com.exe201.planwise.ai.features.planner.dto.GeneratePlannerDraftRequest;
import com.exe201.planwise.ai.features.planner.dto.PlannerApprovalResponse;
import com.exe201.planwise.ai.features.planner.dto.PlannerDraftResponse;
import com.exe201.planwise.ai.features.planner.service.PlannerAssistantService;
import com.exe201.planwise.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai/planner")
@RequiredArgsConstructor
public class PlannerAssistantController {

    private final PlannerAssistantService plannerAssistantService;

    @PostMapping("/generate")
    public ResponseEntity<PlannerDraftResponse> generatePlannerDraft(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody GeneratePlannerDraftRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(plannerAssistantService.generatePlannerDraft(principal.getId(), request));
    }

    @GetMapping("/drafts/{draftId}")
    public ResponseEntity<PlannerDraftResponse> getDraft(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID draftId) {
        return ResponseEntity.ok(plannerAssistantService.getDraft(principal.getId(), draftId));
    }

    @PostMapping("/drafts/{draftId}/approve")
    public ResponseEntity<PlannerApprovalResponse> approveDraft(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID draftId,
            @Valid @RequestBody(required = false) ApprovePlannerDraftRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(plannerAssistantService.approveDraft(principal.getId(), draftId, request));
    }
}
