package com.exe201.planwise.user.service;

import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import com.exe201.planwise.user.dto.UpdateSettingsRequest;
import com.exe201.planwise.user.dto.UserSettingsDto;
import com.exe201.planwise.user.entity.User;
import com.exe201.planwise.user.entity.UserSettings;
import com.exe201.planwise.user.enums.FocusSessionType;
import com.exe201.planwise.user.repository.UserRepository;
import com.exe201.planwise.user.repository.UserSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class SettingsService {

    private final UserRepository userRepository;
    private final UserSettingsRepository settingsRepository;

    @Transactional(readOnly = true)
    public UserSettingsDto getSettings(UUID userId) {
        UserSettings settings = getOrCreateSettings(userId);
        return UserSettingsDto.from(settings);
    }

    @Transactional
    public UserSettingsDto updateSettings(UUID userId, UpdateSettingsRequest request) {
        UserSettings settings = getOrCreateSettings(userId);

        if (request.theme() != null) {
            settings.setTheme(request.theme());
        }
        if (request.defaultFocusType() != null) {
            try {
                settings.setDefaultFocusType(FocusSessionType.valueOf(request.defaultFocusType().toUpperCase()));
            } catch (IllegalArgumentException ignored) {}
        }
        if (request.pomodoroDuration() != null) {
            settings.setPomodoroDuration(request.pomodoroDuration());
        }
        if (request.shortBreakDuration() != null) {
            settings.setShortBreakDuration(request.shortBreakDuration());
        }
        if (request.longBreakDuration() != null) {
            settings.setLongBreakDuration(request.longBreakDuration());
        }
        if (request.dailyTaskLimit() != null) {
            settings.setDailyTaskLimit(request.dailyTaskLimit());
        }
        if (request.notificationEnabled() != null) {
            settings.setNotificationEnabled(request.notificationEnabled());
        }
        if (request.emailDigestEnabled() != null) {
            settings.setEmailDigestEnabled(request.emailDigestEnabled());
        }
        if (request.emailDigestTime() != null) {
            settings.setEmailDigestTime(request.emailDigestTime());
        }
        if (request.onboardingCompleted() != null) {
            settings.setOnboardingCompleted(request.onboardingCompleted());
        }

        settings = settingsRepository.save(settings);
        log.info("Updated settings for user {}", userId);

        return UserSettingsDto.from(settings);
    }

    private UserSettings getOrCreateSettings(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        UserSettings settings = settingsRepository.findByUserId(userId)
                .orElseGet(() -> {
                    UserSettings newSettings = UserSettings.builder()
                            .user(user)
                            .build();
                    return settingsRepository.save(newSettings);
                });

        return settings;
    }
}
