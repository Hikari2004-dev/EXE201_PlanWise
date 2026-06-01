package com.exe201.planwise.category.repository;

import com.exe201.planwise.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {

    List<Category> findByUserIdOrderBySortOrderAsc(UUID userId);

    List<Category> findByUserIdAndIsDefaultTrue(UUID userId);

    @Query("SELECT COUNT(c) FROM Category c WHERE c.user.id = :userId")
    long countByUserId(@Param("userId") UUID userId);

    @Query("SELECT COUNT(c) FROM Category c WHERE c.user.id = :userId AND c.isDefault = false")
    long countCustomByUserId(@Param("userId") UUID userId);

    boolean existsByUserIdAndName(UUID userId, String name);
}
