package com.exe201.planwise.user.repository;

import com.exe201.planwise.user.entity.UserSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserSettingsRepository extends JpaRepository<UserSettings, UUID> {

    Optional<UserSettings> findByUserId(UUID userId);

    @Query(value = "SELECT EXISTS(SELECT 1 FROM user_settings WHERE user_id = :userId)", nativeQuery = true)
    boolean existsByUserIdDirect(@Param("userId") UUID userId);
}
