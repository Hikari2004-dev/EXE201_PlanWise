package com.exe201.planwise.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @Column(name = "full_name", length = 100)
    private String fullName;

    @Column(name = "avatar_url", columnDefinition = "TEXT")
    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UserRole role = UserRole.USER;

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String language = "vi";

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String timezone = "Asia/Ho_Chi_Minh";

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "email_verified", nullable = false)
    @Builder.Default
    private boolean emailVerified = false;

    @Column(name = "last_login_at")
    private OffsetDateTime lastLoginAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    // ── Relationships ──────────────────────────────────────────────────────────

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<OauthProvider> oauthProviders = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<UserSubscription> subscriptions = new ArrayList<>();

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private UserSettings settings;

    // ── Premium Helpers ───────────────────────────────────────────────────────

    public boolean isPremium() {
        if (subscriptions == null) return false;
        java.time.OffsetDateTime now = java.time.OffsetDateTime.now();
        return subscriptions.stream()
                .anyMatch(sub -> "ACTIVE".equals(sub.getStatus()) && sub.getEndDate().isAfter(now));
    }

    public java.time.OffsetDateTime getPremiumExpiresAt() {
        if (subscriptions == null) return null;
        java.time.OffsetDateTime now = java.time.OffsetDateTime.now();
        return subscriptions.stream()
                .filter(sub -> "ACTIVE".equals(sub.getStatus()) && sub.getEndDate().isAfter(now))
                .map(UserSubscription::getEndDate)
                .max(java.time.OffsetDateTime::compareTo)
                .orElse(null);
    }

    // ── Enum ──────────────────────────────────────────────────────────────────

    public enum UserRole {
        USER, ADMIN
    }
}
