package com.exe201.planwise.goal.service;

import com.exe201.planwise.ai.dto.CreateGoalFromDraftRequest;
import com.exe201.planwise.ai.dto.GoalMilestoneDraft;
import com.exe201.planwise.ai.dto.GoalRoadmapDraft;
import com.exe201.planwise.ai.dto.GoalTaskDraft;
import com.exe201.planwise.ai.entity.GoalDraft;
import com.exe201.planwise.ai.entity.GoalDraftStatus;
import com.exe201.planwise.ai.parser.GoalDraftParser;
import com.exe201.planwise.ai.repository.GoalDraftRepository;
import com.exe201.planwise.ai.validator.GoalDraftValidator;
import com.exe201.planwise.category.entity.Category;
import com.exe201.planwise.category.repository.CategoryRepository;
import com.exe201.planwise.common.enums.EventColor;
import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import com.exe201.planwise.goal.dto.*;
import com.exe201.planwise.goal.entity.Goal;
import com.exe201.planwise.goal.entity.Milestone;
import com.exe201.planwise.goal.enums.GoalPeriod;
import com.exe201.planwise.goal.repository.GoalRepository;
import com.exe201.planwise.goal.repository.MilestoneRepository;
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
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class GoalService {

    private static final int FREE_GOAL_LIMIT = 3;

    private final GoalRepository goalRepository;
    private final MilestoneRepository milestoneRepository;
    private final TaskRepository taskRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final GoalDraftRepository goalDraftRepository;
    private final GoalDraftParser goalDraftParser;
    private final GoalDraftValidator goalDraftValidator;

    @Transactional(readOnly = true)
    public GoalListResponse getGoals(UUID userId) {
        User user = findUser(userId);
        List<Goal> goals = goalRepository.findByUserIdOrderBySortOrderAsc(userId);
        List<GoalDto> goalDtos = goals.stream().map(GoalDto::from).toList();
        return GoalListResponse.of(goalDtos, user.isPremium());
    }

    @Transactional(readOnly = true)
    public List<GoalDto> getGoalsByPeriod(UUID userId, GoalPeriod period) {
        List<Goal> goals = goalRepository.findByUserIdAndPeriodOrderBySortOrderAsc(userId, period);
        return goals.stream().map(GoalDto::fromWithoutMilestones).toList();
    }

    @Transactional(readOnly = true)
    public GoalDto getGoalById(UUID userId, UUID goalId) {
        Goal goal = findGoalAndValidateOwnership(goalId, userId);
        return GoalDto.from(goal);
    }

    @Transactional
    public GoalDto createGoalFromDraft(UUID userId, CreateGoalFromDraftRequest request) {
        User user = findUser(userId);
        enforceGoalLimit(user, userId);

        GoalDraft draft = goalDraftRepository.findById(request.draftId())
                .orElseThrow(() -> new AppException(ErrorCode.AI_DRAFT_NOT_FOUND));

        if (!draft.getUser().getId().equals(userId) || draft.getStatus() != GoalDraftStatus.CREATED) {
            throw new AppException(ErrorCode.AI_DRAFT_INVALID, "Bản nháp AI không thể được sử dụng");
        }

        GoalRoadmapDraft roadmap = request.roadmap() != null
                ? request.roadmap()
                : goalDraftParser.fromJson(draft.getGeneratedJson());
        goalDraftValidator.validate(roadmap);

        Category category = findCategory(roadmap.categoryId(), userId);
        Goal goal = Goal.builder()
                .user(user)
                .title(roadmap.title())
                .description(roadmap.description())
                .category(category)
                .goalType(com.exe201.planwise.goal.enums.GoalType.SMART)
                .period(roadmap.period())
                .targetDate(roadmap.targetDate())
                .color("indigo")
                .build();

        goal = goalRepository.save(goal);

        int milestoneOrder = 0;
        for (GoalMilestoneDraft milestoneDraft : roadmap.milestones()) {
            Milestone milestone = Milestone.builder()
                    .goal(goal)
                    .title(milestoneDraft.title())
                    .description(milestoneDraft.description())
                    .targetDate(milestoneDraft.targetDate())
                    .sortOrder((short) milestoneOrder++)
                    .build();
            milestone = milestoneRepository.save(milestone);
            goal.getMilestones().add(milestone);

            int taskOrder = 0;
            for (GoalTaskDraft taskDraft : milestoneDraft.tasks()) {
                taskRepository.save(Task.builder()
                        .user(user)
                        .category(category)
                        .goal(goal)
                        .milestone(milestone)
                        .title(taskDraft.title())
                        .description(taskDraft.description())
                        .dueDate(toDueDate(taskDraft.dueDate()))
                        .priority(parseDraftPriority(taskDraft.priority()))
                        .color(EventColor.indigo)
                        .estimatedTime(taskDraft.estimatedHours())
                        .sortOrder(taskOrder++)
                        .showOnCalendar(true)
                        .build());
            }
        }

        draft.setStatus(GoalDraftStatus.APPROVED);
        draft.setGeneratedJson(goalDraftParser.toJson(roadmap));
        log.info("Created goal {} from AI draft {} for user {}", goal.getId(), draft.getId(), userId);

        return GoalDto.from(goal);
    }

    @Transactional
    public GoalDto createGoal(UUID userId, CreateGoalRequest request) {
        User user = findUser(userId);
        enforceGoalLimit(user, userId);

        Goal goal = Goal.builder()
                .user(user)
                .title(request.title())
                .description(request.description())
                .category(findCategory(request.categoryId(), userId))
                .goalType(request.goalType())
                .period(request.period())
                .targetDate(request.targetDate())
                .color(request.color())
                .build();

        goal = goalRepository.save(goal);
        log.info("Created goal {} for user {}", goal.getId(), userId);

        return GoalDto.from(goal);
    }

    @Transactional
    public GoalDto updateGoal(UUID userId, UUID goalId, UpdateGoalRequest request) {
        Goal goal = findGoalAndValidateOwnership(goalId, userId);

        if (request.title() != null) {
            goal.setTitle(request.title());
        }
        if (request.description() != null) {
            goal.setDescription(request.description());
        }
        if (request.categoryId() != null) {
            goal.setCategory(findCategory(request.categoryId(), userId));
        }
        if (request.goalType() != null) {
            goal.setGoalType(request.goalType());
        }
        if (request.period() != null) {
            goal.setPeriod(request.period());
        }
        if (request.targetDate() != null) {
            goal.setTargetDate(request.targetDate());
        }
        if (request.color() != null) {
            goal.setColor(request.color());
        }
        if (request.progress() != null) {
            short newProgress = (short) Math.min(100, Math.max(0, request.progress()));
            goal.setProgress(newProgress);
            if (newProgress == 100 && !goal.isCompleted()) {
                goal.setCompleted(true);
                goal.setCompletedAt(OffsetDateTime.now());
            } else if (newProgress < 100 && goal.isCompleted()) {
                goal.setCompleted(false);
                goal.setCompletedAt(null);
            }
        }
        if (request.isCompleted() != null) {
            goal.setCompleted(request.isCompleted());
            if (request.isCompleted()) {
                goal.setProgress((short) 100);
                goal.setCompletedAt(OffsetDateTime.now());
            } else {
                goal.setProgress((short) 0);
                goal.setCompletedAt(null);
            }
        }

        goal = goalRepository.save(goal);
        log.info("Updated goal {}", goalId);

        return GoalDto.from(goal);
    }

    @Transactional
    public void deleteGoal(UUID userId, UUID goalId) {
        Goal goal = findGoalAndValidateOwnership(goalId, userId);
        goalRepository.delete(goal);
        log.info("Deleted goal {} for user {}", goalId, userId);
    }

    @Transactional
    public GoalDto incrementProgress(UUID userId, UUID goalId) {
        Goal goal = findGoalAndValidateOwnership(goalId, userId);
        short newProgress = (short) Math.min(100, goal.getProgress() + 10);
        goal.setProgress(newProgress);

        if (newProgress == 100 && !goal.isCompleted()) {
            goal.setCompleted(true);
            goal.setCompletedAt(OffsetDateTime.now());
        }

        goal = goalRepository.save(goal);
        return GoalDto.from(goal);
    }

    // Milestone operations

    @Transactional(readOnly = true)
    public List<MilestoneDto> getMilestones(UUID userId, UUID goalId) {
        findGoalAndValidateOwnership(goalId, userId);
        return milestoneRepository.findByGoalIdOrderBySortOrderAsc(goalId)
                .stream().map(MilestoneDto::from).toList();
    }

    @Transactional
    public MilestoneDto createMilestone(UUID userId, UUID goalId, CreateMilestoneRequest request) {
        Goal goal = findGoalAndValidateOwnership(goalId, userId);

        Milestone milestone = Milestone.builder()
                .goal(goal)
                .title(request.title())
                .description(request.description())
                .targetDate(request.targetDate())
                .build();

        milestone = milestoneRepository.save(milestone);
        log.info("Created milestone {} for goal {}", milestone.getId(), goalId);

        return MilestoneDto.from(milestone);
    }

    @Transactional
    public MilestoneDto updateMilestone(UUID userId, UUID goalId, UUID milestoneId, UpdateMilestoneRequest request) {
        findGoalAndValidateOwnership(goalId, userId);
        Milestone milestone = findMilestoneAndValidateOwnership(milestoneId, goalId);

        if (request.title() != null) {
            milestone.setTitle(request.title());
        }
        if (request.description() != null) {
            milestone.setDescription(request.description());
        }
        if (request.targetDate() != null) {
            milestone.setTargetDate(request.targetDate());
        }
        if (request.completed() != null) {
            milestone.setCompleted(request.completed());
            if (request.completed()) {
                milestone.setCompletedAt(OffsetDateTime.now());
            } else {
                milestone.setCompletedAt(null);
            }
        }

        milestone = milestoneRepository.save(milestone);
        return MilestoneDto.from(milestone);
    }

    @Transactional
    public void deleteMilestone(UUID userId, UUID goalId, UUID milestoneId) {
        findGoalAndValidateOwnership(goalId, userId);
        Milestone milestone = findMilestoneAndValidateOwnership(milestoneId, goalId);
        milestoneRepository.delete(milestone);
    }

    // Helper methods

    private User findUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private Category findCategory(UUID categoryId, UUID userId) {
        if (categoryId == null) {
            throw new AppException(ErrorCode.CATEGORY_NOT_FOUND);
        }

        return categoryRepository.findById(categoryId)
                .filter(category -> category.getUser().getId().equals(userId))
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
    }

    public void enforceGoalLimit(User user, UUID userId) {
        if (!user.isPremium()) {
            long currentCount = goalRepository.countByUserId(userId);
            if (currentCount >= FREE_GOAL_LIMIT) {
                throw new AppException(ErrorCode.GOAL_LIMIT_EXCEEDED);
            }
        }
    }

    private OffsetDateTime toDueDate(LocalDate dueDate) {
        return dueDate == null ? null : dueDate.atTime(23, 59).atOffset(ZoneOffset.UTC);
    }

    private Task.TaskPriority parseDraftPriority(String priority) {
        if (priority == null || priority.isBlank()) {
            return Task.TaskPriority.MEDIUM;
        }
        return switch (priority.trim().toUpperCase(Locale.ROOT).replace('-', '_')) {
            case "HIGH", "CAO" -> Task.TaskPriority.HIGH;
            case "LOW", "THAP", "THẤP" -> Task.TaskPriority.LOW;
            default -> Task.TaskPriority.MEDIUM;
        };
    }

    private Goal findGoalAndValidateOwnership(UUID goalId, UUID userId) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new AppException(ErrorCode.GOAL_NOT_FOUND));

        if (!goal.getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.GOAL_NOT_FOUND);
        }
        return goal;
    }

    private Milestone findMilestoneAndValidateOwnership(UUID milestoneId, UUID goalId) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new AppException(ErrorCode.MILESTONE_NOT_FOUND));

        if (!milestone.getGoal().getId().equals(goalId)) {
            throw new AppException(ErrorCode.MILESTONE_NOT_FOUND);
        }
        return milestone;
    }
}
