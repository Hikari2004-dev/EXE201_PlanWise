package com.exe201.planwise.ai.features.planner.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record PlannerPromptContext(
        OffsetDateTime currentDateTime,
        LocalDate startDate,
        LocalDate endDate,
        String context
) {}
