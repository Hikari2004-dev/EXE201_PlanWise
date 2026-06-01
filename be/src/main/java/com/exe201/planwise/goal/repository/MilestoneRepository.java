package com.exe201.planwise.goal.repository;

import com.exe201.planwise.goal.entity.Milestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MilestoneRepository extends JpaRepository<Milestone, UUID> {

    List<Milestone> findByGoalIdOrderBySortOrderAsc(UUID goalId);

    void deleteByGoalId(UUID goalId);
}
