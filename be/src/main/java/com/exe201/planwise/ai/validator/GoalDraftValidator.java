package com.exe201.planwise.ai.validator;

import com.exe201.planwise.ai.dto.GoalMilestoneDraft;
import com.exe201.planwise.ai.dto.GoalRoadmapDraft;
import com.exe201.planwise.ai.dto.GoalTaskDraft;
import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class GoalDraftValidator {

    public void validate(GoalRoadmapDraft draft) {
        if (draft == null || isBlank(draft.title()) || draft.categoryId() == null || draft.period() == null) {
            throw invalid("Bản nháp thiếu thông tin mục tiêu bắt buộc");
        }
        if (draft.milestones() == null || draft.milestones().isEmpty()) {
            throw invalid("Bản nháp phải có ít nhất một cột mốc");
        }

        LocalDate goalTargetDate = draft.targetDate();
        for (GoalMilestoneDraft milestone : draft.milestones()) {
            validateMilestone(milestone, goalTargetDate);
        }
    }

    private void validateMilestone(GoalMilestoneDraft milestone, LocalDate goalTargetDate) {
        if (milestone == null || isBlank(milestone.title())) {
            throw invalid("Cột mốc trong bản nháp thiếu tiêu đề");
        }
        if (goalTargetDate != null && milestone.targetDate() != null && milestone.targetDate().isAfter(goalTargetDate)) {
            throw invalid("Hạn cột mốc không được sau hạn mục tiêu");
        }
        if (milestone.tasks() == null || milestone.tasks().isEmpty()) {
            throw invalid("Mỗi cột mốc phải có ít nhất một công việc");
        }
        for (GoalTaskDraft task : milestone.tasks()) {
            validateTask(task, goalTargetDate, milestone.targetDate());
        }
    }

    private void validateTask(GoalTaskDraft task, LocalDate goalTargetDate, LocalDate milestoneTargetDate) {
        if (task == null || isBlank(task.title())) {
            throw invalid("Công việc trong bản nháp thiếu tiêu đề");
        }
        if (milestoneTargetDate != null && task.dueDate() != null && task.dueDate().isAfter(milestoneTargetDate)) {
            throw invalid("Hạn công việc không được sau hạn cột mốc");
        }
        if (goalTargetDate != null && task.dueDate() != null && task.dueDate().isAfter(goalTargetDate)) {
            throw invalid("Hạn công việc không được sau hạn mục tiêu");
        }
    }

    private AppException invalid(String message) {
        return new AppException(ErrorCode.AI_DRAFT_INVALID, message);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
