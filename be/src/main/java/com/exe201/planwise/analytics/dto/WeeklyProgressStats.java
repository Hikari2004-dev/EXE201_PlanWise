package com.exe201.planwise.analytics.dto;

import lombok.Builder;

@Builder
public record WeeklyProgressStats(
        int totalTasks,
        int completedTasks,
        int completionRate,
        int totalFocusMinutes,
        int averageEnergyLevel
) {}
