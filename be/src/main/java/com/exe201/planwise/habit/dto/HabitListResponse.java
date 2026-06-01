package com.exe201.planwise.habit.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record HabitListResponse(
        List<HabitDto> habits,
        int totalCount,
        int activeCount,
        boolean isPremium,
        int freeLimit
) {
    public static HabitListResponse of(List<HabitDto> habits, boolean isPremium) {
        int activeCount = (int) habits.stream().filter(HabitDto::isActive).count();

        return HabitListResponse.builder()
                .habits(habits)
                .totalCount(habits.size())
                .activeCount(activeCount)
                .isPremium(isPremium)
                .freeLimit(isPremium ? Integer.MAX_VALUE : 3)
                .build();
    }
}
