package com.exe201.planwise.ai.features.planner.service;

import com.exe201.planwise.ai.features.planner.dto.ApprovePlannerDraftRequest;
import com.exe201.planwise.ai.features.planner.dto.GeneratePlannerDraftRequest;
import com.exe201.planwise.ai.features.planner.dto.PlannerApprovalResponse;
import com.exe201.planwise.ai.features.planner.dto.PlannerDraftResponse;

import java.util.UUID;

public interface PlannerAssistantService {

    PlannerDraftResponse generatePlannerDraft(UUID userId, GeneratePlannerDraftRequest request);

    PlannerDraftResponse getDraft(UUID userId, UUID draftId);

    PlannerApprovalResponse approveDraft(UUID userId, UUID draftId, ApprovePlannerDraftRequest request);
}
