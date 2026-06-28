package com.exe201.planwise.habit.dto;

import com.exe201.planwise.habit.entity.Habit;
import com.exe201.planwise.habit.enums.HabitFrequency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

public record HabitDto(
        UUID id,
        String title,
        String description,
        HabitFrequency frequency,
        short targetCount,
        Set<String> repeatDays,
        short currentStreak,
        short bestStreak,
        String color,
        boolean isActive,
        int sortOrder,
        Set<LocalDate> completedDates,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static HabitDto from(Habit habit) {
        return new HabitDto(
                habit.getId(),
                habit.getTitle(),
                habit.getDescription(),
                habit.getFrequency(),
                habit.getTargetCount(),
                habit.getRepeatDays() != null ? new LinkedHashSet<>(habit.getRepeatDays()) : Set.of(),
                habit.getCurrentStreak(),
                habit.getBestStreak(),
                habit.getColor() != null ? habit.getColor().name() : null,
                habit.isActive(),
                habit.getSortOrder(),
                habit.getCompletedDates() != null ? new LinkedHashSet<>(habit.getCompletedDates()) : Set.of(),
                habit.getCreatedAt(),
                habit.getUpdatedAt()
        );
    }
}
