package com.exe201.planwise.focus.repository;

import com.exe201.planwise.focus.entity.DailyFocus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DailyFocusRepository extends JpaRepository<DailyFocus, UUID> {

    Optional<DailyFocus> findByUserIdAndFocusDate(UUID userId, LocalDate focusDate);

    List<DailyFocus> findByUserIdOrderByFocusDateDesc(UUID userId);
}
