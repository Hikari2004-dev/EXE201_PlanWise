package com.exe201.planwise.analytics.dto;

import lombok.Builder;

@Builder
public record EnergyFluctuation(
        String date,
        int level,
        String mood
) {}
