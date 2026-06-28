package com.exe201.planwise.task.service;

import com.exe201.planwise.category.entity.Category;
import com.exe201.planwise.category.repository.CategoryRepository;
import com.exe201.planwise.common.enums.EventColor;
import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import com.exe201.planwise.goal.entity.Goal;
import com.exe201.planwise.goal.entity.Milestone;
import com.exe201.planwise.goal.repository.GoalRepository;
import com.exe201.planwise.goal.repository.MilestoneRepository;
import com.exe201.planwise.task.dto.*;
import com.exe201.planwise.task.entity.Task;
import com.exe201.planwise.task.repository.TaskRepository;
import com.exe201.planwise.user.entity.User;
import com.exe201.planwise.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final GoalRepository goalRepository;
    private final MilestoneRepository milestoneRepository;

    @Transactional(readOnly = true)
    public TaskListResponse getTasks(UUID userId,
                                     String q,
                                     String status,
                                     Boolean completed,
                                     UUID categoryId,
                                     String priority,
                                     String eisenhowerMatrix,
                                     UUID goalId,
                                     UUID milestoneId,
                                     Boolean showOnCalendar,
                                     LocalDate dateFrom,
                                     LocalDate dateTo) {
        List<Task> filteredTasks = taskRepository.findByUserIdOrderBySortOrderAsc(userId).stream()
                .filter(task -> matchesSearch(task, q))
                .filter(task -> matchesStatus(task, status))
                .filter(task -> completed == null || task.isCompleted() == completed)
                .filter(task -> categoryId == null || (task.getCategory() != null && categoryId.equals(task.getCategory().getId())))
                .filter(task -> matchesPriority(task, priority))
                .filter(task -> matchesEisenhowerMatrix(task, eisenhowerMatrix))
                .filter(task -> goalId == null || (task.getGoal() != null && goalId.equals(task.getGoal().getId())))
                .filter(task -> milestoneId == null || (task.getMilestone() != null && milestoneId.equals(task.getMilestone().getId())))
                .filter(task -> showOnCalendar == null || task.isShowOnCalendar() == showOnCalendar)
                .filter(task -> matchesDateRange(task, dateFrom, dateTo))
                .toList();

        List<TaskDto> taskDtos = filteredTasks.stream().map(this::toTaskDto).toList();

        int pendingCount = (int) filteredTasks.stream()
                .filter(task -> "IN_PROGRESS".equals(resolveStatus(task)))
                .count();
        int completedCount = (int) filteredTasks.stream()
                .filter(task -> "COMPLETED".equals(resolveStatus(task)))
                .count();
        int overdueCount = (int) filteredTasks.stream()
                .filter(task -> "MISSED".equals(resolveStatus(task)))
                .count();

        return TaskListResponse.builder()
                .tasks(taskDtos)
                .totalCount(filteredTasks.size())
                .pendingCount(pendingCount)
                .completedCount(completedCount)
                .overdueCount(overdueCount)
                .build();
    }

    @Transactional(readOnly = true)
    public TaskDto getTaskById(UUID userId, UUID taskId) {
        Task task = findTaskAndValidateOwnership(taskId, userId);
        return toTaskDto(task);
    }

    @Transactional
    public TaskDto createTask(UUID userId, CreateTaskRequest request) {
        User user = findUser(userId);
        Category category = findCategory(request.categoryId(), userId);
        Milestone milestone = findMilestone(request.milestoneId(), userId);
        Goal goal = resolveGoal(request.goalId(), milestone, userId);

        Task.TaskPriority priority = parsePriority(request.priority());
        Task.EisenhowerQuadrant quadrant = parseEisenhowerMatrix(request.eisenhowerMatrix());
        EventColor color = parseColor(request.color());

        Task task = Task.builder()
                .user(user)
                .category(category)
                .goal(goal)
                .milestone(milestone)
                .title(request.title())
                .description(request.description())
                .dueDate(request.dueDate())
                .scheduledAt(request.scheduledAt())
                .priority(priority)
                .color(color)
                .eisenhowerMatrix(quadrant)
                .estimatedTime(request.estimatedTime())
                .contexts(request.contexts() != null ? request.contexts() : List.of())
                .checklist(request.checklist() != null ? request.checklist() : List.of())
                .showOnCalendar(request.showOnCalendar())
                .build();

        applyTaskState(task, request.status(), null);

        task = taskRepository.save(task);
        log.info("Created task {} for user {}", task.getId(), userId);

        return toTaskDto(task);
    }

    @Transactional
    public TaskDto updateTask(UUID userId, UUID taskId, UpdateTaskRequest request) {
        Task task = findTaskAndValidateOwnership(taskId, userId);

        if (request.title() != null) {
            task.setTitle(request.title());
        }
        if (request.description() != null) {
            task.setDescription(request.description());
        }
        if (request.dueDate() != null) {
            task.setDueDate(request.dueDate());
        }
        if (request.scheduledAt() != null) {
            task.setScheduledAt(request.scheduledAt());
        }
        if (request.priority() != null) {
            task.setPriority(parsePriority(request.priority()));
        }
        if (request.color() != null) {
            task.setColor(parseColor(request.color()));
        }
        if (request.eisenhowerMatrix() != null) {
            task.setEisenhowerMatrix(parseEisenhowerMatrix(request.eisenhowerMatrix()));
        }
        if (request.estimatedTime() != null) {
            task.setEstimatedTime(request.estimatedTime());
        }
        if (request.categoryId() != null) {
            task.setCategory(findCategory(request.categoryId(), userId));
        }
        if (request.goalId() != null || request.milestoneId() != null) {
            Goal currentGoal = task.getGoal();
            Milestone currentMilestone = task.getMilestone();
            Goal updatedGoal = request.goalId() != null
                    ? findGoal(request.goalId(), userId)
                    : currentGoal;
            Milestone updatedMilestone = request.milestoneId() != null
                    ? findMilestone(request.milestoneId(), userId)
                    : currentMilestone;

            if (updatedMilestone != null) {
                Goal milestoneGoal = updatedMilestone.getGoal();
                if (updatedGoal != null && !updatedGoal.getId().equals(milestoneGoal.getId())) {
                    if (request.goalId() != null && request.milestoneId() == null) {
                        updatedMilestone = null;
                    } else {
                        throw new AppException(ErrorCode.BAD_REQUEST, "Cột mốc không thuộc mục tiêu đã chọn");
                    }
                }
                updatedGoal = milestoneGoal;
            }

            task.setGoal(updatedGoal);
            task.setMilestone(updatedMilestone);
        }
        if (request.contexts() != null) {
            task.setContexts(request.contexts());
        }
        if (request.checklist() != null) {
            task.setChecklist(request.checklist());
        }
        if (request.showOnCalendar() != null) {
            task.setShowOnCalendar(request.showOnCalendar());
        }
        if (request.status() != null || request.completed() != null) {
            applyTaskState(task, request.status(), request.completed());
        }
        if (request.sortOrder() != null) {
            task.setSortOrder(request.sortOrder());
        }

        task = taskRepository.save(task);
        return toTaskDto(task);
    }

    @Transactional
    public TaskDto toggleComplete(UUID userId, UUID taskId) {
        Task task = findTaskAndValidateOwnership(taskId, userId);
        task.setCompleted(!task.isCompleted());

        if (task.isCompleted()) {
            task.setCompletedAt(OffsetDateTime.now());
        } else {
            task.setCompletedAt(null);
        }

        task = taskRepository.save(task);
        return toTaskDto(task);
    }

    @Transactional
    public void deleteTask(UUID userId, UUID taskId) {
        Task task = findTaskAndValidateOwnership(taskId, userId);
        taskRepository.delete(task);
        log.info("Deleted task {} for user {}", taskId, userId);
    }

    private User findUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private Task findTaskAndValidateOwnership(UUID taskId, UUID userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        if (!task.getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.TASK_NOT_FOUND);
        }
        return task;
    }

    private Category findCategory(UUID categoryId, UUID userId) {
        if (categoryId == null) {
            return null;
        }

        return categoryRepository.findById(categoryId)
                .filter(category -> category.getUser().getId().equals(userId))
                .orElse(null);
    }

    private Goal findGoal(UUID goalId, UUID userId) {
        if (goalId == null) {
            return null;
        }

        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new AppException(ErrorCode.GOAL_NOT_FOUND));

        if (!goal.getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.GOAL_NOT_FOUND);
        }
        return goal;
    }

    private Milestone findMilestone(UUID milestoneId, UUID userId) {
        if (milestoneId == null) {
            return null;
        }

        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new AppException(ErrorCode.MILESTONE_NOT_FOUND));

        if (!milestone.getGoal().getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.MILESTONE_NOT_FOUND);
        }
        return milestone;
    }

    private Goal resolveGoal(UUID goalId, Milestone milestone, UUID userId) {
        Goal goal = findGoal(goalId, userId);
        if (milestone == null) {
            return goal;
        }

        Goal milestoneGoal = milestone.getGoal();
        if (goal != null && !goal.getId().equals(milestoneGoal.getId())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Cột mốc không thuộc mục tiêu đã chọn");
        }
        return milestoneGoal;
    }

    private TaskDto toTaskDto(Task task) {
        return TaskDto.from(task, resolveStatus(task));
    }

    private String resolveStatus(Task task) {
        if (task.isCompleted()) {
            return "COMPLETED";
        }
        if (task.getDueDate() != null && task.getDueDate().isBefore(OffsetDateTime.now())) {
            return "MISSED";
        }
        return "IN_PROGRESS";
    }

    private void applyTaskState(Task task, String status, Boolean completed) {
        if (status != null && !status.isBlank()) {
            String normalizedStatus = normalizeStatus(status);
            if ("COMPLETED".equals(normalizedStatus)) {
                task.setCompleted(true);
                task.setCompletedAt(OffsetDateTime.now());
                return;
            }
            task.setCompleted(false);
            task.setCompletedAt(null);
            return;
        }

        if (completed != null) {
            task.setCompleted(completed);
            if (completed) {
                task.setCompletedAt(OffsetDateTime.now());
            } else {
                task.setCompletedAt(null);
            }
        }
    }

    private boolean matchesSearch(Task task, String q) {
        if (q == null || q.isBlank()) {
            return true;
        }

        String normalized = q.trim().toLowerCase(Locale.ROOT);
        return (task.getTitle() != null && task.getTitle().toLowerCase(Locale.ROOT).contains(normalized))
                || (task.getDescription() != null && task.getDescription().toLowerCase(Locale.ROOT).contains(normalized));
    }

    private boolean matchesStatus(Task task, String status) {
        if (status == null || status.isBlank()) {
            return true;
        }
        return resolveStatus(task).equals(normalizeStatus(status));
    }

    private boolean matchesPriority(Task task, String priority) {
        if (priority == null || priority.isBlank()) {
            return true;
        }

        Task.TaskPriority expected = parsePriority(priority);
        return task.getPriority() == expected;
    }

    private boolean matchesEisenhowerMatrix(Task task, String matrix) {
        if (matrix == null || matrix.isBlank()) {
            return true;
        }

        Task.EisenhowerQuadrant expected = parseEisenhowerMatrix(matrix);
        return expected != null && task.getEisenhowerMatrix() == expected;
    }

    private boolean matchesDateRange(Task task, LocalDate dateFrom, LocalDate dateTo) {
        if (dateFrom == null && dateTo == null) {
            return true;
        }
        if (task.getDueDate() == null) {
            return false;
        }
        LocalDate dueDate = task.getDueDate().toLocalDate();
        if (dateFrom != null && dueDate.isBefore(dateFrom)) {
            return false;
        }
        if (dateTo != null && dueDate.isAfter(dateTo)) {
            return false;
        }
        return true;
    }

    private String normalizeStatus(String status) {
        return status.trim().toUpperCase(Locale.ROOT).replace('-', '_');
    }

    private Task.TaskPriority parsePriority(String priority) {
        if (priority == null) return Task.TaskPriority.MEDIUM;
        return switch (priority.trim()) {
            case "Cao", "HIGH" -> Task.TaskPriority.HIGH;
            case "Thấp", "LOW" -> Task.TaskPriority.LOW;
            case "Trung bình", "MEDIUM" -> Task.TaskPriority.MEDIUM;
            default -> Task.TaskPriority.MEDIUM;
        };
    }

    private Task.EisenhowerQuadrant parseEisenhowerMatrix(String matrix) {
        if (matrix == null) return null;
        return switch (matrix.trim()) {
            case "urgent-important", "urgent_important" -> Task.EisenhowerQuadrant.urgent_important;
            case "not-urgent-important", "not_urgent_important" -> Task.EisenhowerQuadrant.not_urgent_important;
            case "urgent-not-important", "urgent_not_important" -> Task.EisenhowerQuadrant.urgent_not_important;
            case "not-urgent-not-important", "not_urgent_not_important" -> Task.EisenhowerQuadrant.not_urgent_not_important;
            default -> null;
        };
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
}
