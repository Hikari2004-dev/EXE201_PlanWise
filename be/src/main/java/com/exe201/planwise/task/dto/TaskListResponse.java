package com.exe201.planwise.task.dto;

import lombok.Builder;

import java.util.List;
import java.util.UUID;

@Builder
public record TaskListResponse(
        List<TaskDto> tasks,
        int totalCount,
        int pendingCount,
        int completedCount,
        int overdueCount
) {}
