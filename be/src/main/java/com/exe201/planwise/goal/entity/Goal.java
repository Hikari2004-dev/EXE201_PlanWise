package com.exe201.planwise.goal.entity;

import com.exe201.planwise.category.entity.Category;
import com.exe201.planwise.goal.enums.GoalPeriod;
import com.exe201.planwise.goal.enums.GoalType;
import com.exe201.planwise.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "goals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Goal {

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

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(name = "goal_type", nullable = false, length = 10)
    @Builder.Default
    private GoalType goalType = GoalType.SMART;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private GoalPeriod period = GoalPeriod.year;

    @Column(name = "target_date")
    private LocalDate targetDate;

    @Column(name = "progress", nullable = false, columnDefinition = "SMALLINT")
    @Builder.Default
    private short progress = 0;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String color = "indigo";

    @Column(name = "is_completed", nullable = false)
    @Builder.Default
    private boolean isCompleted = false;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;

    @OneToMany(mappedBy = "goal", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Milestone> milestones = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public void addMilestone(Milestone milestone) {
        milestones.add(milestone);
        milestone.setGoal(this);
    }

    public void removeMilestone(Milestone milestone) {
        milestones.remove(milestone);
        milestone.setGoal(null);
    }
}
