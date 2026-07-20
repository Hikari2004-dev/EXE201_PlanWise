package com.exe201.planwise.ai.features.planner.validator;

import com.exe201.planwise.ai.features.planner.dto.PlannerDraftPlan;
import com.exe201.planwise.ai.features.planner.dto.PlannerEventDraft;
import com.exe201.planwise.ai.features.planner.dto.PlannerHabitDraft;
import com.exe201.planwise.ai.features.planner.dto.PlannerTaskDraft;
import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import com.exe201.planwise.habit.enums.HabitFrequency;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Component
public class PlannerDraftValidator {

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final Set<String> VALID_REPEAT_DAYS = Set.of("MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN");
    private static final Set<String> VALID_EISENHOWER = Set.of(
            "urgent-important",
            "urgent_important",
            "not-urgent-important",
            "not_urgent_important",
            "urgent-not-important",
            "urgent_not_important",
            "not-urgent-not-important",
            "not_urgent_not_important"
    );

    public void validate(PlannerDraftPlan plan) {
        normalize(plan);
    }

    public PlannerDraftPlan normalize(PlannerDraftPlan plan) {
        if (plan == null) {
            throw invalid("Bản nháp lập kế hoạch không được để trống");
        }

        LocalDate today = LocalDate.now(DEFAULT_ZONE);
        OffsetDateTime now = OffsetDateTime.now(DEFAULT_ZONE);
        List<String> warnings = new ArrayList<>(plan.warnings());
        plan.events().forEach(event -> validateEvent(event, today, warnings));
        plan.tasks().forEach(task -> validateTask(task, now, warnings));
        plan.habits().forEach(this::validateHabit);

        return new PlannerDraftPlan(
                plan.summary(),
                deduplicateWarnings(warnings),
                plan.events(),
                plan.tasks(),
                plan.habits()
        );
    }

    private void validateEvent(PlannerEventDraft event, LocalDate today, List<String> warnings) {
        if (event == null || isBlank(event.title())) {
            throw invalid("Sự kiện trong bản nháp thiếu tiêu đề");
        }
        if (event.eventDate() == null) {
            throw invalid("Ngày sự kiện trong bản nháp không hợp lệ");
        }
        if (event.eventDate().isBefore(today)) {
            warnings.add("Sự kiện \"" + event.title() + "\" có ngày trong quá khứ.");
        }
        if (event.startHour() == null || event.startHour() < 0 || event.startHour() > 23) {
            throw invalid("Giờ bắt đầu sự kiện phải nằm trong khoảng 0-23");
        }
        int startMin = event.startMin() == null ? 0 : event.startMin();
        if (startMin < 0 || startMin > 59) {
            throw invalid("Phút bắt đầu sự kiện phải nằm trong khoảng 0-59");
        }
        if (event.duration() == null || event.duration() <= 0 || event.duration() > 24) {
            throw invalid("Thời lượng sự kiện không hợp lệ");
        }
    }

    private void validateTask(PlannerTaskDraft task, OffsetDateTime now, List<String> warnings) {
        if (task == null || isBlank(task.title())) {
            throw invalid("Công việc trong bản nháp thiếu tiêu đề");
        }
        if (task.dueDate() != null && task.dueDate().isBefore(now)) {
            warnings.add("Công việc \"" + task.title() + "\" có hạn trong quá khứ.");
        }
        if (task.scheduledAt() != null && task.scheduledAt().isBefore(now)) {
            warnings.add("Công việc \"" + task.title() + "\" có thời gian lên lịch trong quá khứ.");
        }
        if (!isBlank(task.priority())) {
            validatePriority(task.priority());
        }
        if (!isBlank(task.eisenhowerMatrix()) && !VALID_EISENHOWER.contains(task.eisenhowerMatrix().trim())) {
            throw invalid("Ma trận Eisenhower của công việc không hợp lệ");
        }
        if (task.estimatedTime() != null && task.estimatedTime() <= 0) {
            throw invalid("Thời lượng ước tính của công việc phải lớn hơn 0");
        }
    }

    private void validateHabit(PlannerHabitDraft habit) {
        if (habit == null || isBlank(habit.title())) {
            throw invalid("Thói quen trong bản nháp thiếu tiêu đề");
        }
        HabitFrequency frequency = habit.frequency() == null ? HabitFrequency.daily : habit.frequency();
        if (habit.targetCount() != null && habit.targetCount() <= 0) {
            throw invalid("Số lần mục tiêu của thói quen phải lớn hơn 0");
        }
        if (frequency == HabitFrequency.weekly) {
            for (String day : habit.repeatDays()) {
                if (day == null || !VALID_REPEAT_DAYS.contains(day.trim().toUpperCase(Locale.ROOT))) {
                    throw invalid("Ngày lặp lại của thói quen không hợp lệ");
                }
            }
        }
    }

    private void validatePriority(String priority) {
        String normalized = priority.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("HIGH", "MEDIUM", "LOW", "CAO", "THẤP", "TRUNG BÌNH").contains(normalized)) {
            throw invalid("Độ ưu tiên công việc không hợp lệ");
        }
    }

    private AppException invalid(String message) {
        return new AppException(ErrorCode.AI_DRAFT_INVALID, message);
    }

    private List<String> deduplicateWarnings(List<String> warnings) {
        return new ArrayList<>(new LinkedHashSet<>(warnings));
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
