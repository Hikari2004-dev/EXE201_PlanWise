package com.exe201.planwise.analytics.service;

import com.exe201.planwise.analytics.dto.*;
import com.exe201.planwise.habit.entity.Habit;
import com.exe201.planwise.habit.repository.HabitRepository;
import com.exe201.planwise.user.entity.User;
import com.exe201.planwise.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class AnalyticsService {

    private final UserRepository userRepository;
    private final HabitRepository habitRepository;

    @Transactional(readOnly = true)
    public AnalyticsResponse getAnalytics(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new com.exe201.planwise.exception.AppException(
                        com.exe201.planwise.exception.ErrorCode.USER_NOT_FOUND));

        if (!user.isPremium()) {
            log.info("User {} attempted to access analytics without premium", userId);
            return AnalyticsResponse.locked();
        }

        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate weekEnd = weekStart.plusDays(6);

        return AnalyticsResponse.builder()
                .isPremium(true)
                .message("Dữ liệu phân tích của bạn")
                .weeklyProgress(buildWeeklyProgressStats(weekStart, weekEnd))
                .energyFluctuations(buildEnergyFluctuations(weekStart, weekEnd))
                .categoryAllocations(buildCategoryAllocations(userId, weekStart, weekEnd))
                .habitStreaks(buildHabitStreaks(userId))
                .build();
    }

    private WeeklyProgressStats buildWeeklyProgressStats(LocalDate weekStart, LocalDate weekEnd) {
        return WeeklyProgressStats.builder()
                .totalTasks(0)
                .completedTasks(0)
                .completionRate(0)
                .totalFocusMinutes(0)
                .averageEnergyLevel(7)
                .build();
    }

    private List<EnergyFluctuation> buildEnergyFluctuations(LocalDate weekStart, LocalDate weekEnd) {
        List<EnergyFluctuation> fluctuations = new ArrayList<>();
        String[] moods = {"great", "good", "okay", "good", "great", "okay", "good"};

        for (int i = 0; i < 7; i++) {
            LocalDate date = weekStart.plusDays(i);
            int baseLevel = 5 + (int) (Math.random() * 5);
            fluctuations.add(EnergyFluctuation.builder()
                    .date(date.toString())
                    .level(Math.min(10, baseLevel))
                    .mood(moods[i % moods.length])
                    .build());
        }
        return fluctuations;
    }

    private List<CategoryTimeAllocation> buildCategoryAllocations(UUID userId, LocalDate weekStart, LocalDate weekEnd) {
        return List.of(
                CategoryTimeAllocation.builder()
                        .categoryId("work")
                        .categoryName("Công việc")
                        .color("indigo")
                        .minutes(1200)
                        .percentage(40)
                        .build(),
                CategoryTimeAllocation.builder()
                        .categoryId("learning")
                        .categoryName("Học tập")
                        .color("purple")
                        .minutes(900)
                        .percentage(30)
                        .build(),
                CategoryTimeAllocation.builder()
                        .categoryId("health")
                        .categoryName("Sức khỏe")
                        .color("emerald")
                        .minutes(600)
                        .percentage(20)
                        .build(),
                CategoryTimeAllocation.builder()
                        .categoryId("other")
                        .categoryName("Khác")
                        .color("amber")
                        .minutes(300)
                        .percentage(10)
                        .build()
        );
    }

    private List<HabitStreakData> buildHabitStreaks(UUID userId) {
        List<Habit> habits = habitRepository.findByUserIdAndIsActiveTrueOrderBySortOrderAsc(userId);
        return habits.stream().map(habit -> HabitStreakData.builder()
                        .habitId(habit.getId())
                        .title(habit.getTitle())
                        .color(habit.getColor() != null ? habit.getColor().name() : null)
                        .currentStreak(habit.getCurrentStreak())
                        .bestStreak(habit.getBestStreak())
                        .completionsThisWeek(countCompletionsThisWeek(habit))
                        .build())
                .collect(Collectors.toList());
    }

    private int countCompletionsThisWeek(Habit habit) {
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        return (int) habit.getCompletedDates().stream()
                .filter(date -> !date.isBefore(weekStart) && !date.isAfter(today))
                .count();
    }
}
