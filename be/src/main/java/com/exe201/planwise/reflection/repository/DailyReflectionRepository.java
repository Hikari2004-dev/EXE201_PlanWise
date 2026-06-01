package com.exe201.planwise.reflection.repository;

import com.exe201.planwise.reflection.entity.DailyReflection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DailyReflectionRepository extends JpaRepository<DailyReflection, UUID> {

    Optional<DailyReflection> findByUserIdAndReflectionDate(UUID userId, LocalDate reflectionDate);

    List<DailyReflection> findByUserIdOrderByReflectionDateDesc(UUID userId);

    List<DailyReflection> findByUserIdAndReflectionDateBetweenOrderByReflectionDateDesc(UUID userId, LocalDate startDate, LocalDate endDate);
}
