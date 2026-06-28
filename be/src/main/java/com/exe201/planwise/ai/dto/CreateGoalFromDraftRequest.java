package com.exe201.planwise.ai.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateGoalFromDraftRequest(
        @NotNull(message = "Bản nháp không được để trống")
        UUID draftId,

        @Valid
        GoalRoadmapDraft roadmap
) {}
