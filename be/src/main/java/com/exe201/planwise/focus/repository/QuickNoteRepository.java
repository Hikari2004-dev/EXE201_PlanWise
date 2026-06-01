package com.exe201.planwise.focus.repository;

import com.exe201.planwise.focus.entity.QuickNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface QuickNoteRepository extends JpaRepository<QuickNote, UUID> {

    List<QuickNote> findByUserIdOrderByCreatedAtDesc(UUID userId);

    @Query("SELECT qn FROM QuickNote qn WHERE qn.user.id = :userId AND qn.createdAt >= :startTime ORDER BY qn.createdAt DESC")
    List<QuickNote> findByUserIdAndDateRange(@Param("userId") UUID userId, @Param("startTime") OffsetDateTime startTime);
}
