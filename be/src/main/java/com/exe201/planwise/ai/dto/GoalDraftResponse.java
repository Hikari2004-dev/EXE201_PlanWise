package com.exe201.planwise.ai.dto;

import com.exe201.planwise.ai.entity.GoalDraft;
import com.exe201.planwise.ai.entity.GoalDraftStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record GoalDraftResponse(
        UUID id,
        GoalDraftStatus status,
        GoalRoadmapDraft roadmap,
        OffsetDateTime createdAt
) {
    public static GoalDraftResponse from(GoalDraft draft, GoalRoadmapDraft roadmap) {
        return new GoalDraftResponse(draft.getId(), draft.getStatus(), roadmap, draft.getCreatedAt());
    }
}
