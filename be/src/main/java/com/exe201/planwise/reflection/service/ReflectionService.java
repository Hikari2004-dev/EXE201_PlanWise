package com.exe201.planwise.reflection.service;

import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import com.exe201.planwise.reflection.dto.*;
import com.exe201.planwise.reflection.entity.DailyReflection;
import com.exe201.planwise.reflection.repository.DailyReflectionRepository;
import com.exe201.planwise.user.entity.User;
import com.exe201.planwise.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class ReflectionService {

    private final DailyReflectionRepository reflectionRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<DailyReflectionDto> getReflections(UUID userId) {
        return reflectionRepository.findByUserIdOrderByReflectionDateDesc(userId)
                .stream().map(DailyReflectionDto::from).toList();
    }

    @Transactional(readOnly = true)
    public DailyReflectionDto getReflectionByDate(UUID userId, LocalDate date) {
        return reflectionRepository.findByUserIdAndReflectionDate(userId, date)
                .map(DailyReflectionDto::from)
                .orElse(null);
    }

    @Transactional
    public DailyReflectionDto createOrUpdateReflection(UUID userId, CreateReflectionRequest request) {
        User user = findUser(userId);
        LocalDate date = request.reflectionDate() != null ? request.reflectionDate() : LocalDate.now();

        DailyReflection reflection = reflectionRepository.findByUserIdAndReflectionDate(userId, date)
                .orElseGet(() -> DailyReflection.builder()
                        .user(user)
                        .reflectionDate(date)
                        .build());

        if (request.completed() != null) reflection.setCompleted(request.completed());
        if (request.obstacles() != null) reflection.setObstacles(request.obstacles());
        if (request.improvements() != null) reflection.setImprovements(request.improvements());
        if (request.energyLevel() != null) reflection.setEnergyLevel(request.energyLevel().shortValue());
        if (request.mood() != null) {
            try {
                reflection.setMood(DailyReflection.MoodType.valueOf(request.mood()));
            } catch (IllegalArgumentException ignored) {}
        }

        reflection = reflectionRepository.save(reflection);
        log.info("Created/updated reflection {} for user {} on date {}", reflection.getId(), userId, date);

        return DailyReflectionDto.from(reflection);
    }

    @Transactional
    public DailyReflectionDto updateReflection(UUID userId, UUID reflectionId, UpdateReflectionRequest request) {
        DailyReflection reflection = findReflectionAndValidateOwnership(reflectionId, userId);

        if (request.completed() != null) reflection.setCompleted(request.completed());
        if (request.obstacles() != null) reflection.setObstacles(request.obstacles());
        if (request.improvements() != null) reflection.setImprovements(request.improvements());
        if (request.energyLevel() != null) reflection.setEnergyLevel(request.energyLevel().shortValue());
        if (request.mood() != null) {
            try {
                reflection.setMood(DailyReflection.MoodType.valueOf(request.mood()));
            } catch (IllegalArgumentException ignored) {}
        }

        reflection = reflectionRepository.save(reflection);
        return DailyReflectionDto.from(reflection);
    }

    private User findUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private DailyReflection findReflectionAndValidateOwnership(UUID reflectionId, UUID userId) {
        DailyReflection reflection = reflectionRepository.findById(reflectionId)
                .orElseThrow(() -> new AppException(ErrorCode.REFLECTION_NOT_FOUND));

        if (!reflection.getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.REFLECTION_NOT_FOUND);
        }
        return reflection;
    }
}
