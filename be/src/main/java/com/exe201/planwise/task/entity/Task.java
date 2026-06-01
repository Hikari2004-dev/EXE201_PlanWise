package com.exe201.planwise.task.entity;

import com.exe201.planwise.common.enums.EventColor;
import com.exe201.planwise.category.entity.Category;
import com.exe201.planwise.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import jakarta.persistence.Convert;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "priority", columnDefinition = "task_priority", nullable = false)
    @Builder.Default
    private TaskPriority priority = TaskPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "color", columnDefinition = "event_color", nullable = false)
    @Builder.Default
    private EventColor color = EventColor.indigo;

    @Column(nullable = false)
    @Builder.Default
    private boolean completed = false;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "eisenhower_matrix", columnDefinition = "eisenhower_quadrant")
    private EisenhowerQuadrant eisenhowerMatrix;

    @Column(name = "estimated_time", columnDefinition = "SMALLINT")
    private Short estimatedTime;

    @Column(name = "actual_time", columnDefinition = "SMALLINT")
    private Short actualTime;

    @ElementCollection
    @CollectionTable(name = "task_contexts", joinColumns = @JoinColumn(name = "task_id"))
    @Column(name = "context")
    @Builder.Default
    private List<String> contexts = new ArrayList<>();

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public enum TaskPriority {
        HIGH("Cao"),
        MEDIUM("Trung bình"),
        LOW("Thấp");

        private final String dbValue;

        TaskPriority(String dbValue) {
            this.dbValue = dbValue;
        }

        public String getDbValue() {
            return dbValue;
        }

        public static TaskPriority fromDbValue(String dbValue) {
            if (dbValue == null) return null;
            for (TaskPriority v : values()) {
                if (v.dbValue.equals(dbValue)) return v;
            }
            throw new IllegalArgumentException("Unknown task priority: " + dbValue);
        }
    }

    public enum EisenhowerQuadrant {
        urgent_important("urgent-important"),
        not_urgent_important("not-urgent-important"),
        urgent_not_important("urgent-not-important"),
        not_urgent_not_important("not-urgent-not-important");

        private final String dbValue;

        EisenhowerQuadrant(String dbValue) {
            this.dbValue = dbValue;
        }

        public String getDbValue() {
            return dbValue;
        }

        public static EisenhowerQuadrant fromDbValue(String dbValue) {
            if (dbValue == null) return null;
            for (EisenhowerQuadrant v : values()) {
                if (v.dbValue.equals(dbValue)) return v;
            }
            throw new IllegalArgumentException("Unknown eisenhower quadrant: " + dbValue);
        }
    }
}
