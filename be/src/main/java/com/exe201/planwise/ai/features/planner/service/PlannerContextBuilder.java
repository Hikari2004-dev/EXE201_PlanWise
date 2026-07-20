package com.exe201.planwise.ai.features.planner.service;

import com.exe201.planwise.ai.features.planner.dto.GeneratePlannerDraftRequest;
import com.exe201.planwise.category.entity.Category;
import com.exe201.planwise.category.repository.CategoryRepository;
import com.exe201.planwise.event.dto.CalendarEventDto;
import com.exe201.planwise.event.service.CalendarQueryService;
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

    private final CalendarQueryService calendarQueryService;
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
        appendEvents(context, calendarQueryService.getEvents(userId, null, startDate, endDate));
        appendTasks(context, taskRepository.findByUserIdOrderBySortOrderAsc(userId), startDate, endDate, now);
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
        context.append("Available categories (copy the UUID exactly when using categoryId):\n");
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

    private void appendEvents(StringBuilder context, List<CalendarEventDto> events) {
        context.append("Existing calendar events in requested range:\n");
        if (events.isEmpty()) {
            context.append("- none\n\n");
            return;
        }
        events.stream().limit(40).forEach(event -> context
                .append("- ")
                .append(event.eventDate())
                .append(' ')
                .append(twoDigits(event.startHour()))
                .append(':')
                .append(twoDigits(event.startMin()))
                .append(" for ")
                .append(event.duration())
                .append("h | ")
                .append(event.title())
                .append(" | source=")
                .append(event.source())
                .append(event.calendarName() == null ? "" : " | calendar=" + event.calendarName())
                .append('\n'));
        context.append('\n');
    }

    private void appendTasks(StringBuilder context, List<Task> tasks, LocalDate startDate, LocalDate endDate, OffsetDateTime now) {
        context.append("Relevant open tasks, including overdue tasks (copy id exactly when using existingTaskId):\n");
        List<Task> relevantTasks = tasks.stream()
                .filter(task -> !task.isCompleted())
                .filter(task -> isRelevantTask(task, startDate, endDate) || isOverdueTask(task, now))
                .limit(40)
                .toList();
        if (relevantTasks.isEmpty()) {
            context.append("- none\n\n");
            return;
        }
        relevantTasks.forEach(task -> context
                .append("- ")
                .append(task.getId())
                .append(" | ")
                .append(task.getTitle())
                .append(" | due=")
                .append(task.getDueDate() == null ? "none" : task.getDueDate())
                .append(" | scheduled=")
                .append(task.getScheduledAt() == null ? "none" : task.getScheduledAt())
                .append(" | priority=")
                .append(task.getPriority())
                .append(" | categoryId=")
                .append(task.getCategory() == null ? "none" : task.getCategory().getId())
                .append(" | status=")
                .append(isOverdueTask(task, now) ? "overdue" : "open")
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
        context.append("Active goals (copy the UUID exactly when using goalId):\n");
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

    private boolean isOverdueTask(Task task, OffsetDateTime now) {
        return task.getDueDate() != null && task.getDueDate().isBefore(now);
    }

    private String twoDigits(int value) {
        return value < 10 ? "0" + value : Integer.toString(value);
    }
}
