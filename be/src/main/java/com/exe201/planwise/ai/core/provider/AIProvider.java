package com.exe201.planwise.ai.core.provider;

public interface AIProvider {

    String chat(String prompt);

    String generateGoalRoadmap(String prompt);

    default String generateDailyPlan(String prompt) {
        return chat(prompt);
    }

    default String weeklyReview(String prompt) {
        return chat(prompt);
    }

    default String generatePlannerDraft(String prompt) {
        return chat(prompt);
    }
}
