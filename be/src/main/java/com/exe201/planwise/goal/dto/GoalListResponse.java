package com.exe201.planwise.goal.dto;

import com.exe201.planwise.goal.enums.GoalPeriod;
import lombok.Builder;

import java.util.List;
import java.util.UUID;

@Builder
public record GoalListResponse(
        List<GoalDto> goals,
        int totalCount,
        int weeklyCount,
        int monthlyCount,
        int yearlyCount,
        boolean isPremium,
        int freeLimit
) {
    public static GoalListResponse of(List<GoalDto> goals, boolean isPremium) {
        int weekly = (int) goals.stream().filter(g -> g.period() == GoalPeriod.week).count();
        int monthly = (int) goals.stream().filter(g -> g.period() == GoalPeriod.month).count();
        int yearly = (int) goals.stream().filter(g -> g.period() == GoalPeriod.year).count();

        return GoalListResponse.builder()
                .goals(goals)
                .totalCount(goals.size())
                .weeklyCount(weekly)
                .monthlyCount(monthly)
                .yearlyCount(yearly)
                .isPremium(isPremium)
                .freeLimit(isPremium ? Integer.MAX_VALUE : 3)
                .build();
    }
}
