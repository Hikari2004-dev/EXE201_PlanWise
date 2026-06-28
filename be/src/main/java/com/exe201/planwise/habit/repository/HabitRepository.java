package com.exe201.planwise.habit.repository;

import com.exe201.planwise.habit.entity.Habit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HabitRepository extends JpaRepository<Habit, UUID> {

    List<Habit> findByUserIdAndIsActiveTrueOrderBySortOrderAsc(UUID userId);

    Optional<Habit> findByIdAndUserIdAndIsActiveTrue(UUID id, UUID userId);

    @Query("SELECT COUNT(h) FROM Habit h WHERE h.user.id = :userId AND h.isActive = true")
    long countActiveByUserId(@Param("userId") UUID userId);
}
