package com.exe201.planwise.user.repository;

import com.exe201.planwise.user.entity.UserSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, UUID> {

    /**
     * Tìm gói đăng ký đang hoạt động của người dùng mà chưa hết hạn.
     */
    @Query("SELECT us FROM UserSubscription us WHERE us.user.id = :userId " +
           "AND us.status = 'ACTIVE' AND us.endDate > :now ORDER BY us.endDate DESC")
    Optional<UserSubscription> findActiveSubscription(
            @Param("userId") UUID userId,
            @Param("now") OffsetDateTime now
    );
}
