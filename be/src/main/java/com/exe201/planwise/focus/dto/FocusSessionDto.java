package com.exe201.planwise.focus.dto;

import com.exe201.planwise.focus.entity.FocusSession;
import com.exe201.planwise.user.enums.FocusSessionType;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.UUID;

public record FocusSessionDto(
        UUID id,
        OffsetDateTime startTime,
        int duration,
        String sessionType,
        boolean completed,
        OffsetDateTime endTime,
        String notes,
        UUID taskId,
        String taskTitle,
        OffsetDateTime createdAt
) {
    public static FocusSessionDto from(FocusSession session) {
        return new FocusSessionDto(
                session.getId(),
                session.getStartTime(),
                session.getDuration(),
                session.getSessionType().name(),
                session.isCompleted(),
                session.getEndTime(),
                session.getNotes(),
                session.getTask() != null ? session.getTask().getId() : null,
                session.getTask() != null ? session.getTask().getTitle() : null,
                session.getCreatedAt()
        );
    }
}
