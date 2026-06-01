package com.exe201.planwise.reflection.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.time.LocalDate;

public record CreateReflectionRequest(
        LocalDate reflectionDate,
        String completed,
        String obstacles,
        String improvements,
        @Min(1) @Max(10) Integer energyLevel,
        String mood
) {}
