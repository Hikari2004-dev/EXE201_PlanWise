package com.exe201.planwise.event.repository;

import com.exe201.planwise.event.entity.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, UUID> {

    List<CalendarEvent> findByUserIdOrderByEventDateAscStartHourAsc(UUID userId);

    @Query("SELECT e FROM CalendarEvent e WHERE e.user.id = :userId AND e.eventDate = :date ORDER BY e.startHour ASC, e.startMin ASC")
    List<CalendarEvent> findByUserIdAndEventDate(@Param("userId") UUID userId, @Param("date") LocalDate date);

    @Query("SELECT e FROM CalendarEvent e WHERE e.user.id = :userId AND e.eventDate BETWEEN :startDate AND :endDate ORDER BY e.eventDate ASC, e.startHour ASC")
    List<CalendarEvent> findByUserIdAndDateRange(@Param("userId") UUID userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT e FROM CalendarEvent e WHERE e.user.id = :userId AND DAY_OF_WEEK(e.eventDate) = :dayOfWeek ORDER BY e.startHour ASC")
    List<CalendarEvent> findByUserIdAndDayOfWeek(@Param("userId") UUID userId, @Param("dayOfWeek") int dayOfWeek);
}
