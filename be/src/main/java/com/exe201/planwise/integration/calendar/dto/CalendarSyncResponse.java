package com.exe201.planwise.integration.calendar.dto;

import java.util.List;

public record CalendarSyncResponse(
        String provider,
        int total,
        int synchronizedCount,
        int failedCount,
        List<String> errors
) {}
