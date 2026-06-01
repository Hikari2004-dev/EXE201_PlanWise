package com.exe201.planwise.task.repository;

import com.exe201.planwise.task.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {

    List<Task> findByUserIdOrderBySortOrderAsc(UUID userId);

    List<Task> findByUserIdAndCompletedOrderBySortOrderAsc(UUID userId, boolean completed);

    List<Task> findByUserIdAndDueDateBeforeAndCompleted(UUID userId, LocalDate date, boolean completed);

    @Query("SELECT t FROM Task t WHERE t.user.id = :userId AND t.priority = :priority AND t.completed = false ORDER BY t.sortOrder ASC")
    List<Task> findByUserIdAndPriorityAndNotCompleted(@Param("userId") UUID userId, @Param("priority") Task.TaskPriority priority);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.user.id = :userId")
    long countByUserId(@Param("userId") UUID userId);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.user.id = :userId AND t.completed = :completed")
    long countByUserIdAndCompleted(@Param("userId") UUID userId, @Param("completed") boolean completed);
}
