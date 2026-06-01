package com.exe201.planwise.analytics.dto;

import lombok.Builder;

@Builder
public record CategoryTimeAllocation(
        String categoryId,
        String categoryName,
        String color,
        int minutes,
        int percentage
) {}
