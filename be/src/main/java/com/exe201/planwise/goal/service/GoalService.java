package com.exe201.planwise.goal.service;

import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import com.exe201.planwise.goal.dto.*;
import com.exe201.planwise.goal.entity.Goal;
import com.exe201.planwise.goal.entity.Milestone;
import com.exe201.planwise.goal.enums.GoalPeriod;
import com.exe201.planwise.goal.repository.GoalRepository;
import com.exe201.planwise.goal.repository.MilestoneRepository;
import com.exe201.planwise.user.entity.User;
import com.exe201.planwise.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class GoalService {

    private static final int FREE_GOAL_LIMIT = 3;

    private final GoalRepository goalRepository;
    private final MilestoneRepository milestoneRepository;
    private final UserRepository userRepository;

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
    public GoalDto createGoal(UUID userId, CreateGoalRequest request) {
        User user = findUser(userId);

        if (!user.isPremium()) {
            long currentCount = goalRepository.countByUserId(userId);
            if (currentCount >= FREE_GOAL_LIMIT) {
                throw new AppException(ErrorCode.GOAL_LIMIT_EXCEEDED);
            }
        }

        Goal goal = Goal.builder()
                .user(user)
                .title(request.title())
                .description(request.description())
                .category(request.category())
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
        if (request.category() != null) {
            goal.setCategory(request.category());
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
