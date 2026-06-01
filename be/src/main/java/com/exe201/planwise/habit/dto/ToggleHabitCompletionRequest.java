package com.exe201.planwise.habit.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record ToggleHabitCompletionRequest(
        @NotNull(message = "Ngày không được để trống")
        LocalDate date
) {}
