package com.exe201.planwise.ai.features.goal.service;

import com.exe201.planwise.ai.core.workflow.AiDraftGenerator;
import com.exe201.planwise.ai.features.goal.dto.GenerateGoalDraftRequest;
import com.exe201.planwise.ai.features.goal.dto.GoalDraftResponse;
import com.exe201.planwise.ai.features.goal.dto.GoalRoadmapDraft;
import com.exe201.planwise.ai.features.goal.entity.GoalDraft;
import com.exe201.planwise.ai.features.goal.entity.GoalDraftStatus;
import com.exe201.planwise.ai.features.goal.parser.GoalDraftParser;
import com.exe201.planwise.ai.features.goal.repository.GoalDraftRepository;
import com.exe201.planwise.ai.features.goal.validator.GoalDraftValidator;
import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import com.exe201.planwise.user.entity.User;
import com.exe201.planwise.user.repository.UserRepository;
import com.exe201.planwise.goal.service.GoalService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GoalAIServiceImpl implements GoalAIService {

    private final AiDraftGenerator aiDraftGenerator;
    private final GoalDraftParser goalDraftParser;
    private final GoalDraftValidator goalDraftValidator;
    private final GoalDraftRepository goalDraftRepository;
    private final UserRepository userRepository;
    private final GoalService goalService;

    @Override
    @Transactional
    public GoalDraftResponse generateGoalDraft(UUID userId, GenerateGoalDraftRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        goalService.enforceGoalLimit(user, userId);

        goalDraftRepository.findByUserIdAndStatus(userId, GoalDraftStatus.CREATED)
                .forEach(draft -> draft.setStatus(GoalDraftStatus.REJECTED));

        GoalRoadmapDraft roadmap = aiDraftGenerator.generateDraft(
                "goal-planner.txt",
                promptVariables(request),
                goalDraftParser::parse,
                draft -> normalizeRoadmap(draft, request),
                goalDraftValidator::validate
        );

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
                roadmap.description() == null ? request.description() : roadmap.description(),
                roadmap.categoryId() == null ? request.categoryId() : roadmap.categoryId(),
                roadmap.period() == null ? request.period() : roadmap.period(),
                roadmap.targetDate() == null ? request.deadline() : roadmap.targetDate(),
                roadmap.priority() == null ? request.priority() : roadmap.priority(),
                roadmap.milestones()
        );
    }

    private LocalDate getCurrentDate() {
        return LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
    }

    private Map<String, ?> promptVariables(GenerateGoalDraftRequest request) {
        Map<String, Object> variables = new LinkedHashMap<>();
        variables.put("goalTitle", nullToEmpty(request.title()));
        variables.put("goalDescription", nullToEmpty(request.description()));
        variables.put("categoryId", request.categoryId());
        variables.put("categoryName", nullToEmpty(request.categoryName()));
        variables.put("deadline", request.deadline());
        variables.put("period", request.period() == null ? "" : request.period().name());
        variables.put("priority", nullToEmpty(request.priority()));
        variables.put("availableHoursPerWeek", request.availableHoursPerWeek());
        variables.put("constraints", request.constraints() == null ? "" : request.constraints());
        variables.put("currentDate", getCurrentDate());
        return variables;
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
