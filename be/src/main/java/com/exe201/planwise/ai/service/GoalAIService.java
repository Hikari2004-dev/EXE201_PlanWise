package com.exe201.planwise.ai.service;

import com.exe201.planwise.ai.dto.GenerateGoalDraftRequest;
import com.exe201.planwise.ai.dto.GoalDraftResponse;

import java.util.UUID;

public interface GoalAIService {

    GoalDraftResponse generateGoalDraft(UUID userId, GenerateGoalDraftRequest request);
}
