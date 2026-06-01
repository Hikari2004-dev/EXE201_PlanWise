package com.exe201.planwise.user.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.time.LocalTime;

public record UpdateSettingsRequest(
        String theme,
        String defaultFocusType,
        @Min(1) @Max(120) Short pomodoroDuration,
        @Min(1) @Max(60) Short shortBreakDuration,
        @Min(1) @Max(120) Short longBreakDuration,
        @Min(1) @Max(20) Short dailyTaskLimit,
        Boolean notificationEnabled,
        Boolean emailDigestEnabled,
        LocalTime emailDigestTime,
        Boolean onboardingCompleted
) {}
