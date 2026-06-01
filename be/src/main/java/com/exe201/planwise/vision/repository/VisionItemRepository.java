package com.exe201.planwise.vision.repository;

import com.exe201.planwise.vision.entity.VisionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VisionItemRepository extends JpaRepository<VisionItem, UUID> {

    List<VisionItem> findByUserIdOrderBySortOrderAsc(UUID userId);

    List<VisionItem> findByUserIdAndCategory(UUID userId, String category);
}
