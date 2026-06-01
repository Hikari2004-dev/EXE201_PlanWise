package com.exe201.planwise.focus.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "quick_notes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuickNote {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "daily_focus_id")
    private DailyFocus dailyFocus;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private com.exe201.planwise.user.entity.User user;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "note_type", nullable = false, length = 10)
    @Builder.Default
    private NoteType noteType = NoteType.TEXT;

    @Column(name = "media_url")
    private String mediaUrl;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public enum NoteType {
        TEXT, VOICE, IMAGE
    }
}
