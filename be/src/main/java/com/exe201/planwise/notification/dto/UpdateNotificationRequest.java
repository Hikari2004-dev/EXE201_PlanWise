package com.exe201.planwise.notification.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateNotificationRequest(
        @NotNull Boolean read,
        @NotNull Boolean dismissed
) {}
