package com.exe201.planwise.integration.calendar.repository;

import com.exe201.planwise.integration.calendar.entity.CalendarEventMapping;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CalendarEventMappingRepository extends JpaRepository<CalendarEventMapping, UUID> {

    Optional<CalendarEventMapping> findByConnectionIdAndInternalEventId(
            UUID connectionId,
            UUID internalEventId
    );

    List<CalendarEventMapping> findByInternalEventId(UUID internalEventId);
}
