package com.exe201.planwise.ai.controller;

import com.exe201.planwise.ai.dto.GenerateGoalDraftRequest;
import com.exe201.planwise.ai.dto.GoalDraftResponse;
import com.exe201.planwise.ai.service.GoalAIService;
import com.exe201.planwise.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai/goals")
@RequiredArgsConstructor
public class GoalAIController {

    private final GoalAIService goalAIService;

    @PostMapping("/generate")
    public ResponseEntity<GoalDraftResponse> generateGoalDraft(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody GenerateGoalDraftRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(goalAIService.generateGoalDraft(principal.getId(), request));
    }
}
