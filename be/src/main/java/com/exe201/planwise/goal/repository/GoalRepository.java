package com.exe201.planwise.goal.repository;

import com.exe201.planwise.goal.entity.Goal;
import com.exe201.planwise.goal.enums.GoalPeriod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GoalRepository extends JpaRepository<Goal, UUID> {

    List<Goal> findByUserIdOrderBySortOrderAsc(UUID userId);

    List<Goal> findByUserIdAndPeriodOrderBySortOrderAsc(UUID userId, GoalPeriod period);

    @Query("SELECT COUNT(g) FROM Goal g WHERE g.user.id = :userId")
    long countByUserId(@Param("userId") UUID userId);

    @Query("SELECT COUNT(g) FROM Goal g WHERE g.user.id = :userId AND g.period = :period")
    long countByUserIdAndPeriod(@Param("userId") UUID userId, @Param("period") GoalPeriod period);

    @Query("SELECT COUNT(g) FROM Goal g WHERE g.user.id = :userId AND g.isCompleted = false")
    long countActiveByUserId(@Param("userId") UUID userId);
}
