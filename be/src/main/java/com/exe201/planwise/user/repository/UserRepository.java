package com.exe201.planwise.user.repository;

import com.exe201.planwise.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    /**
     * Gọi PostgreSQL function seed_default_categories(uuid) để tạo 6 danh mục mặc định.
     */
    @Query(value = "SELECT seed_default_categories(:userId)", nativeQuery = true)
    void seedDefaultCategories(@Param("userId") UUID userId);
}
