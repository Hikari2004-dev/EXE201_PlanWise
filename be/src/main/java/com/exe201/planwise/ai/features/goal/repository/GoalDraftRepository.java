package com.exe201.planwise.ai.features.goal.repository;

import com.exe201.planwise.ai.features.goal.entity.GoalDraft;
import com.exe201.planwise.ai.features.goal.entity.GoalDraftStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GoalDraftRepository extends JpaRepository<GoalDraft, UUID> {

    List<GoalDraft> findByUserIdAndStatus(UUID userId, GoalDraftStatus status);
}
