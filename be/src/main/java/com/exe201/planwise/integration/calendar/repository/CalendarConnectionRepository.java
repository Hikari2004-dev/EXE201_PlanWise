package com.exe201.planwise.integration.calendar.repository;

import com.exe201.planwise.integration.calendar.entity.CalendarConnection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CalendarConnectionRepository extends JpaRepository<CalendarConnection, UUID> {

    Optional<CalendarConnection> findByUserIdAndProvider(UUID userId, String provider);

    List<CalendarConnection> findByUserId(UUID userId);
}
