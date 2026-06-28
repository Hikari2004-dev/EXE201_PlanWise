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
        List<HabitDto> habitDtos = habits.stream().map(HabitDto::from).toList();
        return HabitListResponse.of(habitDtos, user.isPremium());
    }

    @Transactional(readOnly = true)
    public List<HabitDto> getActiveHabits(UUID userId) {
        return habitRepository.findByUserIdAndIsActiveTrueOrderBySortOrderAsc(userId)
                .stream().map(HabitDto::from).toList();
    }

    @Transactional(readOnly = true)
    public HabitDto getHabitById(UUID userId, UUID habitId) {
        Habit habit = findHabitAndValidateOwnership(habitId, userId);
        return HabitDto.from(habit);
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

        return HabitDto.from(habit);
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
            updateStreakAfterCompletion(habit, date);
            habit = habitRepository.save(habit);
            log.info("Completed habit {} for date {}", habitId, date);
        }

        return HabitDto.from(habit);
    }

    @Transactional
    public HabitDto markCompleted(UUID userId, UUID habitId, LocalDate date) {
        Habit habit = findHabitAndValidateOwnership(habitId, userId);

        if (!habit.isCompletedOn(date)) {
            habit.markCompleted(date);
            updateStreakAfterCompletion(habit, date);
            habit = habitRepository.save(habit);
        }

        return HabitDto.from(habit);
    }

    private void updateStreakAfterCompletion(Habit habit, LocalDate date) {
        short currentStreak = habit.getCurrentStreak();

        if (!habit.getRepeatDays().isEmpty()) {
            LocalDate previousScheduledDate = findPreviousScheduledDate(habit, date);
            if (habit.isCompletedOn(previousScheduledDate) || currentStreak == 0) {
                habit.setCurrentStreak((short) (currentStreak + 1));
                if (habit.getCurrentStreak() > habit.getBestStreak()) {
                    habit.setBestStreak(habit.getCurrentStreak());
                }
            }
            return;
        }

        if (habit.getFrequency() == HabitFrequency.daily) {
            LocalDate yesterday = date.minusDays(1);
            if (habit.isCompletedOn(yesterday) || currentStreak == 0) {
                habit.setCurrentStreak((short) (currentStreak + 1));
                if (habit.getCurrentStreak() > habit.getBestStreak()) {
                    habit.setBestStreak(habit.getCurrentStreak());
                }
            }
        } else if (habit.getFrequency() == HabitFrequency.weekly) {
            LocalDate lastWeekStart = date.minusWeeks(1).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            if (habit.isCompletedOn(lastWeekStart) || currentStreak == 0) {
                habit.setCurrentStreak((short) (currentStreak + 1));
                if (habit.getCurrentStreak() > habit.getBestStreak()) {
                    habit.setBestStreak(habit.getCurrentStreak());
                }
            }
        }
    }

    private LocalDate findPreviousScheduledDate(Habit habit, LocalDate date) {
        for (int i = 1; i <= 7; i++) {
            LocalDate candidate = date.minusDays(i);
            if (habit.getRepeatDays().contains(toDayCode(candidate))) {
                return candidate;
            }
        }
        return date.minusDays(1);
    }

    private String toDayCode(LocalDate date) {
        return switch (date.getDayOfWeek()) {
            case MONDAY -> "MON";
            case TUESDAY -> "TUE";
            case WEDNESDAY -> "WED";
            case THURSDAY -> "THU";
            case FRIDAY -> "FRI";
            case SATURDAY -> "SAT";
            case SUNDAY -> "SUN";
        };
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
