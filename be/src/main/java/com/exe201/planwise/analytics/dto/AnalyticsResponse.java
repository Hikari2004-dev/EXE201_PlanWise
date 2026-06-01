package com.exe201.planwise.analytics.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record AnalyticsResponse(
        boolean isPremium,
        String message,
        WeeklyProgressStats weeklyProgress,
        List<EnergyFluctuation> energyFluctuations,
        List<CategoryTimeAllocation> categoryAllocations,
        List<HabitStreakData> habitStreaks
) {
    public static AnalyticsResponse locked() {
        return AnalyticsResponse.builder()
                .isPremium(false)
                .message("Vui lòng nâng cấp Premium để truy cập phân tích chi tiết")
                .build();
    }
}
