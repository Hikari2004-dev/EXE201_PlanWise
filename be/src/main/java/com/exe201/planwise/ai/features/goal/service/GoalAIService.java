package com.exe201.planwise.ai.features.goal.service;

import com.exe201.planwise.ai.features.goal.dto.GenerateGoalDraftRequest;
import com.exe201.planwise.ai.features.goal.dto.GoalDraftResponse;

import java.util.UUID;

public interface GoalAIService {

    GoalDraftResponse generateGoalDraft(UUID userId, GenerateGoalDraftRequest request);
}
