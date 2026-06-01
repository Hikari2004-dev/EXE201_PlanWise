package com.exe201.planwise.focus.service;

import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import com.exe201.planwise.focus.dto.*;
import com.exe201.planwise.focus.entity.DailyFocus;
import com.exe201.planwise.focus.entity.FocusSession;
import com.exe201.planwise.focus.entity.QuickNote;
import com.exe201.planwise.focus.repository.DailyFocusRepository;
import com.exe201.planwise.focus.repository.FocusSessionRepository;
import com.exe201.planwise.focus.repository.QuickNoteRepository;
import com.exe201.planwise.task.entity.Task;
import com.exe201.planwise.task.repository.TaskRepository;
import com.exe201.planwise.user.entity.User;
import com.exe201.planwise.user.enums.FocusSessionType;
import com.exe201.planwise.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class FocusService {

    private final FocusSessionRepository focusSessionRepository;
    private final DailyFocusRepository dailyFocusRepository;
    private final QuickNoteRepository quickNoteRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;

    // Focus Sessions

    @Transactional(readOnly = true)
    public List<FocusSessionDto> getFocusSessions(UUID userId) {
        return focusSessionRepository.findByUserIdOrderByStartTimeDesc(userId)
                .stream().map(FocusSessionDto::from).toList();
    }

    @Transactional
    public FocusSessionDto createFocusSession(UUID userId, CreateFocusSessionRequest request) {
        User user = findUser(userId);
        Task task = null;

        if (request.taskId() != null) {
            task = taskRepository.findById(request.taskId())
                    .filter(t -> t.getUser().getId().equals(userId))
                    .orElse(null);
        }

        FocusSessionType sessionType = FocusSessionType.POMODORO;
        if (request.sessionType() != null) {
            try {
                sessionType = FocusSessionType.valueOf(request.sessionType().toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        FocusSession session = FocusSession.builder()
                .user(user)
                .task(task)
                .startTime(request.startTime())
                .duration((short) request.duration())
                .sessionType(sessionType)
                .notes(request.notes())
                .build();

        session = focusSessionRepository.save(session);
        log.info("Created focus session {} for user {}", session.getId(), userId);

        return FocusSessionDto.from(session);
    }

    @Transactional
    public FocusSessionDto completeFocusSession(UUID userId, UUID sessionId) {
        FocusSession session = findSessionAndValidateOwnership(sessionId, userId);
        session.setCompleted(true);
        session.setEndTime(OffsetDateTime.now());
        session = focusSessionRepository.save(session);
        return FocusSessionDto.from(session);
    }

    // Daily Focus

    @Transactional(readOnly = true)
    public DailyFocusDto getDailyFocus(UUID userId, LocalDate date) {
        DailyFocus focus = dailyFocusRepository.findByUserIdAndFocusDate(userId, date)
                .orElseGet(() -> createDailyFocus(userId, date));
        return DailyFocusDto.from(focus);
    }

    @Transactional
    public DailyFocusDto addTopTask(UUID userId, LocalDate date, UUID taskId) {
        DailyFocus focus = getOrCreateDailyFocus(userId, date);
        focus.addTopTask(taskId);
        focus = dailyFocusRepository.save(focus);
        return DailyFocusDto.from(focus);
    }

    @Transactional
    public DailyFocusDto removeTopTask(UUID userId, LocalDate date, UUID taskId) {
        DailyFocus focus = getOrCreateDailyFocus(userId, date);
        focus.removeTopTask(taskId);
        focus = dailyFocusRepository.save(focus);
        return DailyFocusDto.from(focus);
    }

    @Transactional
    public DailyFocusDto updateDailyNotes(UUID userId, LocalDate date, String notes) {
        DailyFocus focus = getOrCreateDailyFocus(userId, date);
        focus.setNotes(notes);
        focus = dailyFocusRepository.save(focus);
        return DailyFocusDto.from(focus);
    }

    // Quick Notes

    @Transactional(readOnly = true)
    public List<QuickNoteDto> getQuickNotes(UUID userId) {
        return quickNoteRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(QuickNoteDto::from).toList();
    }

    @Transactional
    public QuickNoteDto createQuickNote(UUID userId, CreateQuickNoteRequest request) {
        User user = findUser(userId);

        QuickNote.NoteType noteType = QuickNote.NoteType.TEXT;
        if (request.noteType() != null) {
            try {
                noteType = QuickNote.NoteType.valueOf(request.noteType().toLowerCase());
            } catch (IllegalArgumentException ignored) {}
        }

        QuickNote note = QuickNote.builder()
                .user(user)
                .content(request.content())
                .noteType(noteType)
                .mediaUrl(request.mediaUrl())
                .build();

        note = quickNoteRepository.save(note);
        log.info("Created quick note {} for user {}", note.getId(), userId);

        return QuickNoteDto.from(note);
    }

    @Transactional
    public void deleteQuickNote(UUID userId, UUID noteId) {
        QuickNote note = quickNoteRepository.findById(noteId)
                .orElseThrow(() -> new AppException(ErrorCode.QUICK_NOTE_NOT_FOUND));

        if (!note.getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.QUICK_NOTE_NOT_FOUND);
        }

        quickNoteRepository.delete(note);
    }

    // Helpers

    private DailyFocus createDailyFocus(UUID userId, LocalDate date) {
        User user = findUser(userId);
        DailyFocus focus = DailyFocus.builder()
                .user(user)
                .focusDate(date)
                .build();
        return dailyFocusRepository.save(focus);
    }

    private DailyFocus getOrCreateDailyFocus(UUID userId, LocalDate date) {
        return dailyFocusRepository.findByUserIdAndFocusDate(userId, date)
                .orElseGet(() -> createDailyFocus(userId, date));
    }

    private User findUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private FocusSession findSessionAndValidateOwnership(UUID sessionId, UUID userId) {
        FocusSession session = focusSessionRepository.findById(sessionId)
                .orElseThrow(() -> new AppException(ErrorCode.FOCUS_SESSION_NOT_FOUND));

        if (!session.getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.FOCUS_SESSION_NOT_FOUND);
        }
        return session;
    }
}
