package com.exe201.planwise.focus.dto;

import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CreateFocusSessionRequest(
        @NotNull(message = "Thời gian bắt đầu không được để trống")
        OffsetDateTime startTime,

        int duration,

        String sessionType,

        UUID taskId,

        String notes
) {}
