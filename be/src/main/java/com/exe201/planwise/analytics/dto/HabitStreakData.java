package com.exe201.planwise.analytics.dto;

import lombok.Builder;

import java.util.UUID;

@Builder
public record HabitStreakData(
        UUID habitId,
        String title,
        String color,
        int currentStreak,
        int bestStreak,
        int completionsThisWeek
) {}
