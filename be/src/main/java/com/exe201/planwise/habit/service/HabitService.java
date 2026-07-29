package com.exe201.planwise.habit.service;

import com.exe201.planwise.common.enums.EventColor;
import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import com.exe201.planwise.habit.dto.*;
import com.exe201.planwise.habit.entity.Habit;
import com.exe201.planwise.habit.enums.HabitFrequency;
import com.exe201.planwise.habit.repository.HabitRepository;
import com.exe201.planwise.user.entity.User;
import com.exe201.planwise.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.TemporalAdjusters;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class HabitService {

    private static final int FREE_HABIT_LIMIT = 3;
    private static final Set<String> VALID_REPEAT_DAYS = Set.of(
            "MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"
    );

    private final HabitRepository habitRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public HabitListResponse getHabits(UUID userId) {
        User user = findUser(userId);
        List<Habit> habits = habitRepository.findByUserIdAndIsActiveTrueOrderBySortOrderAsc(userId);
        List<HabitDto> habitDtos = habits.stream().map(this::toDto).toList();
        return HabitListResponse.of(habitDtos, user.isPremium());
    }

    @Transactional(readOnly = true)
    public List<HabitDto> getActiveHabits(UUID userId) {
        return habitRepository.findByUserIdAndIsActiveTrueOrderBySortOrderAsc(userId)
                .stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public HabitDto getHabitById(UUID userId, UUID habitId) {
        Habit habit = findHabitAndValidateOwnership(habitId, userId);
        return toDto(habit);
    }

    @Transactional
    public HabitDto createHabit(UUID userId, CreateHabitRequest request) {
        User user = findUser(userId);

        if (!user.isPremium()) {
            long currentCount = habitRepository.countActiveByUserId(userId);
            if (currentCount >= FREE_HABIT_LIMIT) {
                throw new AppException(ErrorCode.HABIT_LIMIT_EXCEEDED);
            }
        }

        Habit habit = Habit.builder()
                .user(user)
                .title(request.title())
                .description(request.description())
                .frequency(request.frequency())
                .targetCount(request.targetCount())
                .repeatDays(normalizeRepeatDays(request.frequency(), request.repeatDays()))
                .color(parseColor(request.color()))
                .build();

        habit = habitRepository.save(habit);
        log.info("Created habit {} for user {}", habit.getId(), userId);

        return toDto(habit);
    }

    @Transactional
    public HabitDto updateHabit(UUID userId, UUID habitId, UpdateHabitRequest request) {
        Habit habit = findHabitAndValidateOwnership(habitId, userId);

        if (request.title() != null) {
            habit.setTitle(request.title());
        }
        if (request.description() != null) {
            habit.setDescription(request.description());
        }
        if (request.frequency() != null) {
            habit.setFrequency(request.frequency());
        }
        if (request.targetCount() != null) {
            habit.setTargetCount(request.targetCount());
        }
        if (request.frequency() != null || request.repeatDays() != null) {
            Set<String> requestedDays = request.repeatDays() != null
                    ? request.repeatDays()
                    : habit.getRepeatDays();
            habit.setRepeatDays(normalizeRepeatDays(habit.getFrequency(), requestedDays));
        }
        if (request.color() != null) {
            habit.setColor(parseColor(request.color()));
        }
        if (request.isActive() != null) {
            habit.setActive(request.isActive());
        }
        if (request.sortOrder() != null) {
            habit.setSortOrder(request.sortOrder());
        }

        refreshStreaks(habit, LocalDate.now());
        habit = habitRepository.save(habit);
        log.info("Updated habit {}", habitId);

        return HabitDto.from(habit);
    }

    @Transactional
    public void deleteHabit(UUID userId, UUID habitId) {
        Habit habit = findHabitAndValidateOwnership(habitId, userId);
        habit.setActive(false);
        habitRepository.save(habit);
        log.info("Soft-deleted habit {} for user {}", habitId, userId);
    }

    @Transactional
    public HabitDto completeHabit(UUID userId, UUID habitId, LocalDate date) {
        Habit habit = findHabitAndValidateOwnership(habitId, userId);

        if (!habit.isCompletedOn(date)) {
            habit.markCompleted(date);
            refreshStreaks(habit, LocalDate.now());
            habit = habitRepository.save(habit);
            log.info("Completed habit {} for date {}", habitId, date);
        }

        return toDto(habit);
    }

    @Transactional
    public HabitDto markCompleted(UUID userId, UUID habitId, LocalDate date) {
        Habit habit = findHabitAndValidateOwnership(habitId, userId);

        if (!habit.isCompletedOn(date)) {
            habit.markCompleted(date);
            refreshStreaks(habit, LocalDate.now());
            habit = habitRepository.save(habit);
        }

        return toDto(habit);
    }

    private HabitDto toDto(Habit habit) {
        refreshStreaks(habit, LocalDate.now());
        return HabitDto.from(habit);
    }

    private void refreshStreaks(Habit habit, LocalDate referenceDate) {
        Set<LocalDate> completedDates = habit.getCompletedDates() != null ? habit.getCompletedDates() : Set.of();
        HabitFrequency frequency = habit.getFrequency() != null ? habit.getFrequency() : HabitFrequency.daily;

        int currentStreak = switch (frequency) {
            case weekly -> calculateCurrentWeeklyStreak(completedDates, referenceDate);
            case monthly -> calculateCurrentMonthlyStreak(completedDates, referenceDate);
            case daily -> calculateCurrentDailyStreak(completedDates, referenceDate);
        };
        int bestStreak = switch (frequency) {
            case weekly -> calculateBestWeeklyStreak(completedDates);
            case monthly -> calculateBestMonthlyStreak(completedDates);
            case daily -> calculateBestDailyStreak(completedDates);
        };

        habit.setCurrentStreak(toShortStreak(currentStreak));
        habit.setBestStreak(toShortStreak(bestStreak));
    }

    private int calculateCurrentDailyStreak(Set<LocalDate> completedDates, LocalDate referenceDate) {
        LocalDate cursor = completedDates.contains(referenceDate) ? referenceDate : referenceDate.minusDays(1);
        int streak = 0;

        while (completedDates.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }

        return streak;
    }

    private int calculateBestDailyStreak(Set<LocalDate> completedDates) {
        List<LocalDate> sortedDates = completedDates.stream().sorted().toList();
        LocalDate previousDate = null;
        int currentStreak = 0;
        int bestStreak = 0;

        for (LocalDate date : sortedDates) {
            if (previousDate != null && date.equals(previousDate.plusDays(1))) {
                currentStreak++;
            } else {
                currentStreak = 1;
            }
            bestStreak = Math.max(bestStreak, currentStreak);
            previousDate = date;
        }

        return bestStreak;
    }

    private int calculateCurrentWeeklyStreak(Set<LocalDate> completedDates, LocalDate referenceDate) {
        Set<LocalDate> completedWeeks = completedDates.stream()
                .map(this::startOfWeek)
                .collect(Collectors.toSet());

        LocalDate currentWeek = startOfWeek(referenceDate);
        LocalDate cursor = completedWeeks.contains(currentWeek) ? currentWeek : currentWeek.minusWeeks(1);
        int streak = 0;

        while (completedWeeks.contains(cursor)) {
            streak++;
            cursor = cursor.minusWeeks(1);
        }

        return streak;
    }

    private int calculateBestWeeklyStreak(Set<LocalDate> completedDates) {
        List<LocalDate> sortedWeeks = completedDates.stream()
                .map(this::startOfWeek)
                .distinct()
                .sorted()
                .toList();
        LocalDate previousWeek = null;
        int currentStreak = 0;
        int bestStreak = 0;

        for (LocalDate week : sortedWeeks) {
            if (previousWeek != null && week.equals(previousWeek.plusWeeks(1))) {
                currentStreak++;
            } else {
                currentStreak = 1;
            }
            bestStreak = Math.max(bestStreak, currentStreak);
            previousWeek = week;
        }

        return bestStreak;
    }

    private int calculateCurrentMonthlyStreak(Set<LocalDate> completedDates, LocalDate referenceDate) {
        Set<YearMonth> completedMonths = completedDates.stream()
                .map(YearMonth::from)
                .collect(Collectors.toSet());

        YearMonth currentMonth = YearMonth.from(referenceDate);
        YearMonth cursor = completedMonths.contains(currentMonth) ? currentMonth : currentMonth.minusMonths(1);
        int streak = 0;

        while (completedMonths.contains(cursor)) {
            streak++;
            cursor = cursor.minusMonths(1);
        }

        return streak;
    }

    private int calculateBestMonthlyStreak(Set<LocalDate> completedDates) {
        List<YearMonth> sortedMonths = completedDates.stream()
                .map(YearMonth::from)
                .distinct()
                .sorted()
                .toList();
        YearMonth previousMonth = null;
        int currentStreak = 0;
        int bestStreak = 0;

        for (YearMonth month : sortedMonths) {
            if (previousMonth != null && month.equals(previousMonth.plusMonths(1))) {
                currentStreak++;
            } else {
                currentStreak = 1;
            }
            bestStreak = Math.max(bestStreak, currentStreak);
            previousMonth = month;
        }

        return bestStreak;
    }

    private LocalDate startOfWeek(LocalDate date) {
        return date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    private short toShortStreak(int value) {
        return (short) Math.min(Math.max(value, 0), Short.MAX_VALUE);
    }

    private Set<String> normalizeRepeatDays(HabitFrequency frequency, Set<String> repeatDays) {
        if (frequency != HabitFrequency.weekly || repeatDays == null || repeatDays.isEmpty()) {
            return new LinkedHashSet<>();
        }

        return repeatDays.stream()
                .filter(day -> day != null && !day.isBlank())
                .map(day -> day.trim().toUpperCase())
                .filter(VALID_REPEAT_DAYS::contains)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private EventColor parseColor(String color) {
        if (color == null || color.isBlank()) {
            return EventColor.indigo;
        }

        try {
            return EventColor.valueOf(color.trim().toLowerCase());
        } catch (IllegalArgumentException ignored) {
            return EventColor.indigo;
        }
    }

    private User findUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private Habit findHabitAndValidateOwnership(UUID habitId, UUID userId) {
        return habitRepository.findByIdAndUserIdAndIsActiveTrue(habitId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.HABIT_NOT_FOUND));
    }
}
