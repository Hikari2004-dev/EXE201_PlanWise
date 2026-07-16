package com.exe201.planwise.ai.features.planner.dto;

import jakarta.validation.Valid;

public record ApprovePlannerDraftRequest(
        @Valid
        PlannerDraftPlan plan
) {}
