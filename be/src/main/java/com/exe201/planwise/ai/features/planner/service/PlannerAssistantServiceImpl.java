package com.exe201.planwise.ai.features.planner.service;

import com.exe201.planwise.ai.core.workflow.AiDraftGenerator;
import com.exe201.planwise.ai.features.planner.dto.*;
import com.exe201.planwise.ai.features.planner.entity.PlannerDraft;
import com.exe201.planwise.ai.features.planner.entity.PlannerDraftStatus;
import com.exe201.planwise.ai.features.planner.parser.PlannerDraftParser;
import com.exe201.planwise.ai.features.planner.repository.PlannerDraftRepository;
import com.exe201.planwise.ai.features.planner.validator.PlannerDraftValidator;
import com.exe201.planwise.category.entity.Category;
import com.exe201.planwise.category.repository.CategoryRepository;
import com.exe201.planwise.event.dto.CalendarEventDto;
import com.exe201.planwise.event.dto.CreateEventRequest;
import com.exe201.planwise.event.service.CalendarEventService;
import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import com.exe201.planwise.habit.dto.CreateHabitRequest;
import com.exe201.planwise.habit.dto.HabitDto;
import com.exe201.planwise.habit.enums.HabitFrequency;
import com.exe201.planwise.habit.service.HabitService;
import com.exe201.planwise.task.dto.CreateTaskRequest;
import com.exe201.planwise.task.dto.TaskDto;
import com.exe201.planwise.task.dto.UpdateTaskRequest;
import com.exe201.planwise.task.service.TaskService;
import com.exe201.planwise.user.entity.User;
import com.exe201.planwise.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PlannerAssistantServiceImpl implements PlannerAssistantService {

    private final AiDraftGenerator aiDraftGenerator;
    private final PlannerContextBuilder plannerContextBuilder;
    private final PlannerDraftParser plannerDraftParser;
    private final PlannerDraftValidator plannerDraftValidator;
    private final PlannerDraftRepository plannerDraftRepository;
    private final UserRepository userRepository;
    private final CalendarEventService eventService;
    private final TaskService taskService;
    private final HabitService habitService;
    private final CategoryRepository categoryRepository;

    @Override
    @Transactional
    public PlannerDraftResponse generatePlannerDraft(UUID userId, GeneratePlannerDraftRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        plannerDraftRepository.findByUserIdAndStatus(userId, PlannerDraftStatus.CREATED)
                .forEach(draft -> draft.setStatus(PlannerDraftStatus.REJECTED));

        PlannerPromptContext context = plannerContextBuilder.build(userId, request);
        PlannerDraftPlan plan = aiDraftGenerator.generateDraft(
                "planner-assistant.txt",
                promptVariables(request, context),
                plannerDraftParser::parse,
                plannerDraftValidator::normalize,
                draft -> {}
        );

        PlannerDraft draft = PlannerDraft.builder()
                .user(user)
                .generatedJson(plannerDraftParser.toJson(plan))
                .status(PlannerDraftStatus.CREATED)
                .build();

        return PlannerDraftResponse.from(plannerDraftRepository.save(draft), plan);
    }

    @Override
    @Transactional(readOnly = true)
    public PlannerDraftResponse getDraft(UUID userId, UUID draftId) {
        PlannerDraft draft = findDraft(draftId, userId);
        return PlannerDraftResponse.from(draft, plannerDraftParser.fromJson(draft.getGeneratedJson()));
    }

    @Override
    @Transactional
    public PlannerApprovalResponse approveDraft(UUID userId, UUID draftId, ApprovePlannerDraftRequest request) {
        PlannerDraft draft = findDraft(draftId, userId);
        if (draft.getStatus() != PlannerDraftStatus.CREATED) {
            throw new AppException(ErrorCode.AI_DRAFT_INVALID, "Bản nháp lập kế hoạch không thể được sử dụng");
        }

        PlannerDraftPlan plan = request != null && request.plan() != null
                ? request.plan()
                : plannerDraftParser.fromJson(draft.getGeneratedJson());
        plan = plannerDraftValidator.normalize(plan);

        List<CalendarEventDto> events = new ArrayList<>();
        for (PlannerEventDraft eventDraft : plan.events()) {
            events.add(eventService.createEvent(userId, toCreateEventRequest(userId, eventDraft)));
        }

        List<TaskDto> tasks = new ArrayList<>();
        for (PlannerTaskDraft taskDraft : plan.tasks()) {
            tasks.add(applyTaskDraft(userId, taskDraft));
        }

        List<HabitDto> habits = new ArrayList<>();
        for (PlannerHabitDraft habitDraft : plan.habits()) {
            habits.add(habitService.createHabit(userId, toCreateHabitRequest(habitDraft)));
        }

        draft.setGeneratedJson(plannerDraftParser.toJson(plan));
        draft.setStatus(PlannerDraftStatus.APPROVED);
        return new PlannerApprovalResponse(events, tasks, habits);
    }

    private PlannerDraft findDraft(UUID draftId, UUID userId) {
        PlannerDraft draft = plannerDraftRepository.findById(draftId)
                .orElseThrow(() -> new AppException(ErrorCode.AI_DRAFT_NOT_FOUND));
        if (!draft.getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.AI_DRAFT_NOT_FOUND);
        }
        return draft;
    }

    private Map<String, ?> promptVariables(GeneratePlannerDraftRequest request, PlannerPromptContext context) {
        Map<String, Object> variables = new LinkedHashMap<>();
        variables.put("userRequest", request.message());
        variables.put("constraints", request.constraints() == null ? "" : request.constraints());
        variables.put("currentDateTime", context.currentDateTime());
        variables.put("startDate", context.startDate());
        variables.put("endDate", context.endDate());
        variables.put("plannerContext", context.context());
        return variables;
    }

    private CreateEventRequest toCreateEventRequest(UUID userId, PlannerEventDraft draft) {
        return new CreateEventRequest(
                draft.title(),
                draft.eventDate(),
                draft.startHour(),
                draft.startMin() == null ? 0 : draft.startMin(),
                draft.duration(),
                resolveCategoryColor(userId, draft.categoryId()),
                draft.location(),
                draft.notes(),
                draft.categoryId(),
                draft.isRecurring(),
                draft.recurrenceRule()
        );
    }

    private CreateTaskRequest toCreateTaskRequest(UUID userId, PlannerTaskDraft draft) {
        return new CreateTaskRequest(
                draft.title(),
                draft.description(),
                draft.dueDate(),
                draft.scheduledAt(),
                draft.priority(),
                resolveCategoryColor(userId, draft.categoryId()),
                draft.categoryId(),
                draft.goalId(),
                draft.milestoneId(),
                draft.eisenhowerMatrix(),
                "IN_PROGRESS",
                draft.estimatedTime(),
                draft.contexts(),
                draft.checklist(),
                draft.showOnCalendar()
        );
    }

    private TaskDto applyTaskDraft(UUID userId, PlannerTaskDraft draft) {
        if (draft.existingTaskId() != null) {
            return taskService.updateTask(userId, draft.existingTaskId(), toUpdateTaskRequest(userId, draft));
        }
        return taskService.createTask(userId, toCreateTaskRequest(userId, draft));
    }

    private UpdateTaskRequest toUpdateTaskRequest(UUID userId, PlannerTaskDraft draft) {
        UUID categoryId = draft.categoryId();
        return new UpdateTaskRequest(
                draft.title(),
                draft.description(),
                draft.dueDate(),
                draft.scheduledAt(),
                draft.priority(),
                categoryId == null ? null : resolveCategoryColor(userId, categoryId),
                categoryId,
                draft.goalId(),
                draft.milestoneId(),
                draft.eisenhowerMatrix(),
                null,
                draft.estimatedTime(),
                null,
                draft.contexts(),
                draft.checklist(),
                draft.showOnCalendar(),
                null
        );
    }

    private CreateHabitRequest toCreateHabitRequest(PlannerHabitDraft draft) {
        return new CreateHabitRequest(
                draft.title(),
                draft.description(),
                draft.frequency() == null ? HabitFrequency.daily : draft.frequency(),
                draft.targetCount() == null ? (short) 1 : draft.targetCount(),
                draft.repeatDays(),
                "emerald"
        );
    }

    private String resolveCategoryColor(UUID userId, UUID categoryId) {
        if (categoryId == null) {
            return "indigo";
        }
        return categoryRepository.findById(categoryId)
                .filter(category -> category.getUser().getId().equals(userId))
                .map(Category::getColor)
                .map(Enum::name)
                .orElse("indigo");
    }
}
