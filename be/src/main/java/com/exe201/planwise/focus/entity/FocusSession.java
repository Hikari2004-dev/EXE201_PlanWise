package com.exe201.planwise.focus.entity;

import com.exe201.planwise.task.entity.Task;
import com.exe201.planwise.user.entity.User;
import com.exe201.planwise.user.enums.FocusSessionType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "focus_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FocusSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "daily_focus_id")
    private DailyFocus dailyFocus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private Task task;

    @Column(name = "start_time", nullable = false)
    private OffsetDateTime startTime;

    @Column(name = "duration", nullable = false, columnDefinition = "SMALLINT")
    private short duration;

    @Enumerated(EnumType.STRING)
    @Column(name = "session_type", nullable = false, length = 20)
    @Builder.Default
    private FocusSessionType sessionType = FocusSessionType.POMODORO;

    @Column(nullable = false)
    @Builder.Default
    private boolean completed = false;

    @Column(name = "end_time")
    private OffsetDateTime endTime;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
