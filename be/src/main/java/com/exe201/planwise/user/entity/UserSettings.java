package com.exe201.planwise.user.entity;

import com.exe201.planwise.user.enums.FocusSessionType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSettings {

    @Id
    @Column(name = "user_id", updatable = false, nullable = false)
    private UUID userId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String theme = "light";

    @Column(name = "default_focus_type", nullable = false, length = 20)
    @Builder.Default
    private FocusSessionType defaultFocusType = FocusSessionType.POMODORO;

    @Column(name = "pomodoro_duration", nullable = false)
    @Builder.Default
    private short pomodoroDuration = 25;

    @Column(name = "short_break_duration", nullable = false)
    @Builder.Default
    private short shortBreakDuration = 5;

    @Column(name = "long_break_duration", nullable = false)
    @Builder.Default
    private short longBreakDuration = 15;

    @Column(name = "daily_task_limit", nullable = false)
    @Builder.Default
    private short dailyTaskLimit = 5;

    @Column(name = "notification_enabled", nullable = false)
    @Builder.Default
    private boolean notificationEnabled = true;

    @Column(name = "email_digest_enabled", nullable = false)
    @Builder.Default
    private boolean emailDigestEnabled = false;

    @Column(name = "email_digest_time")
    private LocalTime emailDigestTime;

    @Column(name = "onboarding_completed", nullable = false)
    @Builder.Default
    private boolean onboardingCompleted = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
