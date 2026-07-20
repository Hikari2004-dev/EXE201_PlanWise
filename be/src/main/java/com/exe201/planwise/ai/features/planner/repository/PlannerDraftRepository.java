package com.exe201.planwise.ai.features.planner.repository;

import com.exe201.planwise.ai.features.planner.entity.PlannerDraft;
import com.exe201.planwise.ai.features.planner.entity.PlannerDraftStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PlannerDraftRepository extends JpaRepository<PlannerDraft, UUID> {

    List<PlannerDraft> findByUserIdAndStatus(UUID userId, PlannerDraftStatus status);
}
