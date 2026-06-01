package com.exe201.planwise.user.dto;

import com.exe201.planwise.user.entity.UserSettings;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.time.LocalTime;

public record UserSettingsDto(
        String theme,
        String defaultFocusType,
        short pomodoroDuration,
        short shortBreakDuration,
        short longBreakDuration,
        short dailyTaskLimit,
        boolean notificationEnabled,
        boolean emailDigestEnabled,
        LocalTime emailDigestTime,
        boolean onboardingCompleted
) {
    public static UserSettingsDto from(UserSettings settings) {
        return new UserSettingsDto(
                settings.getTheme(),
                settings.getDefaultFocusType().name(),
                settings.getPomodoroDuration(),
                settings.getShortBreakDuration(),
                settings.getLongBreakDuration(),
                settings.getDailyTaskLimit(),
                settings.isNotificationEnabled(),
                settings.isEmailDigestEnabled(),
                settings.getEmailDigestTime(),
                settings.isOnboardingCompleted()
        );
    }
}
