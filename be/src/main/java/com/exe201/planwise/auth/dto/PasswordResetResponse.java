package com.exe201.planwise.auth.dto;

public record PasswordResetResponse(
        String message
) {
    public static PasswordResetResponse of(String message) {
        return new PasswordResetResponse(message);
    }
}
