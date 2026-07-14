package com.exe201.planwise.ai.features.planner.service;

import com.exe201.planwise.ai.features.planner.dto.GeneratePlannerDraftRequest;
import com.exe201.planwise.category.entity.Category;
import com.exe201.planwise.category.repository.CategoryRepository;
import com.exe201.planwise.event.entity.CalendarEvent;
import com.exe201.planwise.event.repository.CalendarEventRepository;
import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import com.exe201.planwise.goal.entity.Goal;
import com.exe201.planwise.goal.repository.GoalRepository;
import com.exe201.planwise.habit.entity.Habit;
import com.exe201.planwise.habit.repository.HabitRepository;
import com.exe201.planwise.task.entity.Task;
import com.exe201.planwise.task.repository.TaskRepository;
import com.exe201.planwise.user.entity.UserSettings;
import com.exe201.planwise.user.repository.UserSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PlannerContextBuilder {

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final CalendarEventRepository eventRepository;
    private final TaskRepository taskRepository;
    private final HabitRepository habitRepository;
    private final GoalRepository goalRepository;
    private final CategoryRepository categoryRepository;
    private final UserSettingsRepository settingsRepository;

    public PlannerPromptContext build(UUID userId, GeneratePlannerDraftRequest request) {
        OffsetDateTime now = OffsetDateTime.now(DEFAULT_ZONE);
        LocalDate startDate = request.startDate() == null ? now.toLocalDate() : request.startDate();
        LocalDate endDate = request.endDate() == null ? startDate.plusDays(14) : request.endDate();
        if (endDate.isBefore(startDate)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Ngày kết thúc không được trước ngày bắt đầu");
        }

        StringBuilder context = new StringBuilder();
        appendSettings(context, userId);
        appendCategories(context, categoryRepository.findByUserIdOrderBySortOrderAsc(userId));
        appendEvents(context, eventRepository.findByUserIdAndDateRange(userId, startDate, endDate));
        appendTasks(context, taskRepository.findByUserIdOrderBySortOrderAsc(userId), startDate, endDate);
        appendHabits(context, habitRepository.findByUserIdAndIsActiveTrueOrderBySortOrderAsc(userId));
        appendGoals(context, goalRepository.findByUserIdOrderBySortOrderAsc(userId));

        return new PlannerPromptContext(now, startDate, endDate, context.toString());
    }

    private void appendSettings(StringBuilder context, UUID userId) {
        settingsRepository.findByUserId(userId).ifPresent(settings -> {
            context.append("User settings:\n");
            context.append("- Daily task limit: ").append(settings.getDailyTaskLimit()).append('\n');
            context.append("- Default focus type: ").append(settings.getDefaultFocusType()).append('\n');
            context.append("- Pomodoro duration: ").append(settings.getPomodoroDuration()).append(" minutes\n\n");
        });
    }

    private void appendCategories(StringBuilder context, List<Category> categories) {
        context.append("Available categories:\n");
        if (categories.isEmpty()) {
            context.append("- none\n\n");
            return;
        }
        categories.forEach(category -> context
                .append("- ")
                .append(category.getId())
                .append(" | ")
                .append(category.getName())
                .append(" | color=")
                .append(category.getColor())
                .append('\n'));
        context.append('\n');
    }

    private void appendEvents(StringBuilder context, List<CalendarEvent> events) {
        context.append("Existing calendar events in requested range:\n");
        if (events.isEmpty()) {
            context.append("- none\n\n");
            return;
        }
        events.stream().limit(40).forEach(event -> context
                .append("- ")
                .append(event.getEventDate())
                .append(' ')
                .append(twoDigits(event.getStartHour()))
                .append(':')
                .append(twoDigits(event.getStartMin()))
                .append(" for ")
                .append(event.getDuration())
                .append("h | ")
                .append(event.getTitle())
                .append('\n'));
        context.append('\n');
    }

    private void appendTasks(StringBuilder context, List<Task> tasks, LocalDate startDate, LocalDate endDate) {
        context.append("Relevant open tasks:\n");
        List<Task> relevantTasks = tasks.stream()
                .filter(task -> !task.isCompleted())
                .filter(task -> isRelevantTask(task, startDate, endDate))
                .limit(40)
                .toList();
        if (relevantTasks.isEmpty()) {
            context.append("- none\n\n");
            return;
        }
        relevantTasks.forEach(task -> context
                .append("- ")
                .append(task.getTitle())
                .append(" | due=")
                .append(task.getDueDate() == null ? "none" : task.getDueDate())
                .append(" | scheduled=")
                .append(task.getScheduledAt() == null ? "none" : task.getScheduledAt())
                .append(" | priority=")
                .append(task.getPriority())
                .append('\n'));
        context.append('\n');
    }

    private void appendHabits(StringBuilder context, List<Habit> habits) {
        context.append("Active habits:\n");
        if (habits.isEmpty()) {
            context.append("- none\n\n");
            return;
        }
        habits.stream().limit(30).forEach(habit -> context
                .append("- ")
                .append(habit.getTitle())
                .append(" | frequency=")
                .append(habit.getFrequency())
                .append(" | repeatDays=")
                .append(habit.getRepeatDays())
                .append('\n'));
        context.append('\n');
    }

    private void appendGoals(StringBuilder context, List<Goal> goals) {
        context.append("Active goals:\n");
        List<Goal> activeGoals = goals.stream()
                .filter(goal -> !goal.isCompleted())
                .limit(30)
                .toList();
        if (activeGoals.isEmpty()) {
            context.append("- none\n\n");
            return;
        }
        activeGoals.forEach(goal -> context
                .append("- ")
                .append(goal.getId())
                .append(" | ")
                .append(goal.getTitle())
                .append(" | period=")
                .append(goal.getPeriod())
                .append(" | target=")
                .append(goal.getTargetDate())
                .append('\n'));
        context.append('\n');
    }

    private boolean isRelevantTask(Task task, LocalDate startDate, LocalDate endDate) {
        if (task.getDueDate() == null && task.getScheduledAt() == null) {
            return true;
        }
        return isWithinRange(task.getDueDate(), startDate, endDate)
                || isWithinRange(task.getScheduledAt(), startDate, endDate);
    }

    private boolean isWithinRange(OffsetDateTime dateTime, LocalDate startDate, LocalDate endDate) {
        if (dateTime == null) {
            return false;
        }
        LocalDate date = dateTime.toLocalDate();
        return !date.isBefore(startDate) && !date.isAfter(endDate);
    }

    private String twoDigits(int value) {
        return value < 10 ? "0" + value : Integer.toString(value);
    }
}
