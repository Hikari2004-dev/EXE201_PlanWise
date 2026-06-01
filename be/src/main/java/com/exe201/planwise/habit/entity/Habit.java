package com.exe201.planwise.habit.entity;

import com.exe201.planwise.habit.enums.HabitFrequency;
import com.exe201.planwise.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "habits")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Habit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private HabitFrequency frequency = HabitFrequency.daily;

    @Column(name = "target_count", nullable = false)
    @Builder.Default
    private short targetCount = 1;

    @Column(name = "current_streak", nullable = false)
    @Builder.Default
    private short currentStreak = 0;

    @Column(name = "best_streak", nullable = false)
    @Builder.Default
    private short bestStreak = 0;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String color = "indigo";

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;

    @ElementCollection
    @CollectionTable(name = "habit_completions", joinColumns = @JoinColumn(name = "habit_id"))
    @Column(name = "completed_date")
    @Builder.Default
    private Set<LocalDate> completedDates = new HashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public void markCompleted(LocalDate date) {
        this.completedDates.add(date);
    }

    public void unmarkCompleted(LocalDate date) {
        this.completedDates.remove(date);
    }

    public boolean isCompletedOn(LocalDate date) {
        return this.completedDates.contains(date);
    }
}
