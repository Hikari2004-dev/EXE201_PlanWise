package com.exe201.planwise.focus.repository;

import com.exe201.planwise.focus.entity.FocusSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface FocusSessionRepository extends JpaRepository<FocusSession, UUID> {

    List<FocusSession> findByUserIdOrderByStartTimeDesc(UUID userId);

    @Query("SELECT fs FROM FocusSession fs WHERE fs.user.id = :userId AND fs.startTime >= :startTime AND fs.startTime < :endTime ORDER BY fs.startTime ASC")
    List<FocusSession> findByUserIdAndDateRange(@Param("userId") UUID userId, @Param("startTime") OffsetDateTime startTime, @Param("endTime") OffsetDateTime endTime);

    @Query("SELECT SUM(fs.duration) FROM FocusSession fs WHERE fs.user.id = :userId AND fs.startTime >= :startTime AND fs.startTime < :endTime AND fs.completed = true")
    Integer sumDurationByUserIdAndDateRange(@Param("userId") UUID userId, @Param("startTime") OffsetDateTime startTime, @Param("endTime") OffsetDateTime endTime);
}
