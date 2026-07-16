package com.exe201.planwise.ai.features.planner.dto;

import com.exe201.planwise.ai.features.planner.entity.PlannerDraft;
import com.exe201.planwise.ai.features.planner.entity.PlannerDraftStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record PlannerDraftResponse(
        UUID id,
        PlannerDraftStatus status,
        PlannerDraftPlan plan,
        OffsetDateTime createdAt
) {
    public static PlannerDraftResponse from(PlannerDraft draft, PlannerDraftPlan plan) {
        return new PlannerDraftResponse(draft.getId(), draft.getStatus(), plan, draft.getCreatedAt());
    }
}
