package com.exe201.planwise.ai.features.planner.dto;

import jakarta.validation.Valid;

import java.util.List;

public record PlannerDraftPlan(
        String summary,

        @Valid
        List<PlannerEventDraft> events,

        @Valid
        List<PlannerTaskDraft> tasks,

        @Valid
        List<PlannerHabitDraft> habits
) {
    public PlannerDraftPlan {
        if (events == null) events = List.of();
        if (tasks == null) tasks = List.of();
        if (habits == null) habits = List.of();
    }
}
