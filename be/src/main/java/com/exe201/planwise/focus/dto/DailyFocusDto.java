package com.exe201.planwise.focus.dto;

import com.exe201.planwise.focus.entity.DailyFocus;
import com.exe201.planwise.focus.entity.QuickNote;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record DailyFocusDto(
        UUID id,
        LocalDate focusDate,
        String notes,
        List<UUID> topTaskIds,
        List<QuickNoteDto> quickNotes,
        List<FocusSessionDto> focusSessions,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static DailyFocusDto from(DailyFocus dailyFocus) {
        return new DailyFocusDto(
                dailyFocus.getId(),
                dailyFocus.getFocusDate(),
                dailyFocus.getNotes(),
                dailyFocus.getTopTaskIds(),
                dailyFocus.getQuickNotes().stream().map(QuickNoteDto::from).toList(),
                dailyFocus.getFocusSessions().stream().map(FocusSessionDto::from).toList(),
                dailyFocus.getCreatedAt(),
                dailyFocus.getUpdatedAt()
        );
    }
}
