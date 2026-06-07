package com.exe201.planwise.task.service;

import com.exe201.planwise.category.entity.Category;
import com.exe201.planwise.category.repository.CategoryRepository;
import com.exe201.planwise.common.enums.EventColor;
import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
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
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public TaskListResponse getTasks(UUID userId) {
        List<Task> tasks = taskRepository.findByUserIdOrderBySortOrderAsc(userId);
        List<TaskDto> taskDtos = tasks.stream().map(TaskDto::from).toList();
        
        int pendingCount = (int) tasks.stream().filter(t -> !t.isCompleted()).count();
        int completedCount = (int) tasks.stream().filter(Task::isCompleted).count();
        int overdueCount = (int) tasks.stream()
                .filter(t -> !t.isCompleted() && t.getDueDate() != null && t.getDueDate().isBefore(LocalDate.now()))
                .count();

        return TaskListResponse.builder()
                .tasks(taskDtos)
                .totalCount(tasks.size())
                .pendingCount(pendingCount)
                .completedCount(completedCount)
                .overdueCount(overdueCount)
                .build();
    }

    @Transactional(readOnly = true)
    public TaskDto getTaskById(UUID userId, UUID taskId) {
        Task task = findTaskAndValidateOwnership(taskId, userId);
        return TaskDto.from(task);
    }

    @Transactional
    public TaskDto createTask(UUID userId, CreateTaskRequest request) {
        User user = findUser(userId);
        Category category = null;
        
        if (request.categoryId() != null) {
            category = categoryRepository.findById(request.categoryId())
                    .filter(c -> c.getUser().getId().equals(userId))
                    .orElse(null);
        }

        Task.TaskPriority priority = parsePriority(request.priority());
        Task.EisenhowerQuadrant quadrant = parseEisenhowerMatrix(request.eisenhowerMatrix());
        EventColor color = parseColor(request.color());

        Task task = Task.builder()
                .user(user)
                .category(category)
                .title(request.title())
                .description(request.description())
                .dueDate(request.dueDate())
                .priority(priority)
            .color(color)
                .eisenhowerMatrix(quadrant)
                .estimatedTime(request.estimatedTime())
                .contexts(request.contexts())
                .build();

        task = taskRepository.save(task);
        log.info("Created task {} for user {}", task.getId(), userId);

        return TaskDto.from(task);
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
            Category category = categoryRepository.findById(request.categoryId())
                    .filter(c -> c.getUser().getId().equals(userId))
                    .orElse(null);
            task.setCategory(category);
        }
        if (request.contexts() != null) {
            task.setContexts(request.contexts());
        }
        if (request.completed() != null) {
            task.setCompleted(request.completed());
            if (request.completed()) {
                task.setCompletedAt(OffsetDateTime.now());
            } else {
                task.setCompletedAt(null);
            }
        }
        if (request.sortOrder() != null) {
            task.setSortOrder(request.sortOrder());
        }

        task = taskRepository.save(task);
        return TaskDto.from(task);
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
        return TaskDto.from(task);
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
