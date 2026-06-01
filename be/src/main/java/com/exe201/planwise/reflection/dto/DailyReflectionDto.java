package com.exe201.planwise.reflection.dto;

import com.exe201.planwise.reflection.entity.DailyReflection;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record DailyReflectionDto(
        UUID id,
        LocalDate reflectionDate,
        String completed,
        String obstacles,
        String improvements,
        Short energyLevel,
        String mood,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static DailyReflectionDto from(DailyReflection reflection) {
        return new DailyReflectionDto(
                reflection.getId(),
                reflection.getReflectionDate(),
                reflection.getCompleted(),
                reflection.getObstacles(),
                reflection.getImprovements(),
                reflection.getEnergyLevel(),
                reflection.getMood() != null ? reflection.getMood().name() : null,
                reflection.getCreatedAt(),
                reflection.getUpdatedAt()
        );
    }
}
