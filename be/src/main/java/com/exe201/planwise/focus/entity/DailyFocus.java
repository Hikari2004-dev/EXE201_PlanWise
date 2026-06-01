package com.exe201.planwise.focus.entity;

import com.exe201.planwise.task.entity.Task;
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
@Table(name = "daily_focus")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyFocus {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "focus_date", nullable = false, unique = true)
    private LocalDate focusDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ElementCollection
    @CollectionTable(name = "daily_focus_tasks", joinColumns = @JoinColumn(name = "daily_focus_id"))
    @Column(name = "task_id")
    @Builder.Default
    private List<UUID> topTaskIds = new ArrayList<>();

    @OneToMany(mappedBy = "dailyFocus", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<QuickNote> quickNotes = new ArrayList<>();

    @OneToMany(mappedBy = "dailyFocus", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<FocusSession> focusSessions = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public void addTopTask(UUID taskId) {
        if (!topTaskIds.contains(taskId)) {
            topTaskIds.add(taskId);
        }
    }

    public void removeTopTask(UUID taskId) {
        topTaskIds.remove(taskId);
    }

    public void addQuickNote(QuickNote note) {
        quickNotes.add(note);
        note.setDailyFocus(this);
    }

    public void removeQuickNote(QuickNote note) {
        quickNotes.remove(note);
        note.setDailyFocus(null);
    }

    public void addFocusSession(FocusSession session) {
        focusSessions.add(session);
        session.setDailyFocus(this);
    }
}
