package com.exe201.planwise.ai.service;

import com.exe201.planwise.ai.dto.GenerateGoalDraftRequest;
import com.exe201.planwise.ai.dto.GoalDraftResponse;
import com.exe201.planwise.ai.dto.GoalRoadmapDraft;
import com.exe201.planwise.ai.entity.GoalDraft;
import com.exe201.planwise.ai.entity.GoalDraftStatus;
import com.exe201.planwise.ai.parser.GoalDraftParser;
import com.exe201.planwise.ai.prompt.PromptLoader;
import com.exe201.planwise.ai.provider.AIProvider;
import com.exe201.planwise.ai.repository.GoalDraftRepository;
import com.exe201.planwise.ai.validator.GoalDraftValidator;
import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import com.exe201.planwise.user.entity.User;
import com.exe201.planwise.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GoalAIServiceImpl implements GoalAIService {

    private final AIProvider aiProvider;
    private final PromptLoader promptLoader;
    private final GoalDraftParser goalDraftParser;
    private final GoalDraftValidator goalDraftValidator;
    private final GoalDraftRepository goalDraftRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public GoalDraftResponse generateGoalDraft(UUID userId, GenerateGoalDraftRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        goalDraftRepository.findByUserIdAndStatus(userId, GoalDraftStatus.CREATED)
                .forEach(draft -> draft.setStatus(GoalDraftStatus.REJECTED));

        String prompt = injectVariables(promptLoader.load("goal-planner.txt"), request);
        GoalRoadmapDraft roadmap = goalDraftParser.parse(aiProvider.generateGoalRoadmap(prompt));
        roadmap = normalizeRoadmap(roadmap, request);
        goalDraftValidator.validate(roadmap);

        GoalDraft draft = GoalDraft.builder()
                .user(user)
                .generatedJson(goalDraftParser.toJson(roadmap))
                .status(GoalDraftStatus.CREATED)
                .build();

        return GoalDraftResponse.from(goalDraftRepository.save(draft), roadmap);
    }

    private GoalRoadmapDraft normalizeRoadmap(GoalRoadmapDraft roadmap, GenerateGoalDraftRequest request) {
        return new GoalRoadmapDraft(
                roadmap.title() == null || roadmap.title().isBlank() ? request.title() : roadmap.title(),
                roadmap.summary(),
                roadmap.description() == null ? request.description() : roadmap.description(),
                roadmap.categoryId() == null ? request.categoryId() : roadmap.categoryId(),
                roadmap.period() == null ? request.period() : roadmap.period(),
                roadmap.targetDate() == null ? resolveTargetDate(request) : roadmap.targetDate(),
                roadmap.priority() == null ? request.priority() : roadmap.priority(),
                roadmap.milestones()
        );
    }

    private LocalDate resolveTargetDate(GenerateGoalDraftRequest request) {
        return request.targetDate() != null ? request.targetDate() : request.deadline();
    }

    private String injectVariables(String template, GenerateGoalDraftRequest request) {
        return template
                .replace("{{goalTitle}}", nullToEmpty(request.title()))
                .replace("{{goalDescription}}", nullToEmpty(request.description()))
                .replace("{{categoryId}}", request.categoryId().toString())
                .replace("{{categoryName}}", nullToEmpty(request.categoryName()))
                .replace("{{deadline}}", request.deadline() == null ? "" : request.deadline().toString())
                .replace("{{period}}", request.period().name())
                .replace("{{targetDate}}", request.targetDate() == null ? "" : request.targetDate().toString())
                .replace("{{priority}}", nullToEmpty(request.priority()))
                .replace("{{availableHoursPerWeek}}", request.availableHoursPerWeek() == null ? "" : request.availableHoursPerWeek().toString())
                .replace("{{constraints}}", request.constraints() == null ? "" : String.join("; ", request.constraints()));
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
