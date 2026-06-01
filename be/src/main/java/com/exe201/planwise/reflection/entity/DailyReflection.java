package com.exe201.planwise.reflection.entity;

import com.exe201.planwise.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "daily_reflections")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyReflection {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "reflection_date", nullable = false, unique = true)
    private LocalDate reflectionDate;

    @Column(columnDefinition = "TEXT")
    private String completed;

    @Column(columnDefinition = "TEXT")
    private String obstacles;

    @Column(columnDefinition = "TEXT")
    private String improvements;

    @Column(name = "energy_level", columnDefinition = "SMALLINT")
    private Short energyLevel;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private MoodType mood;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public enum MoodType {
        great, good, okay, bad, terrible
    }
}
