package com.exe201.planwise.focus.dto;

import com.exe201.planwise.focus.entity.QuickNote;
import jakarta.validation.constraints.NotBlank;

import java.time.OffsetDateTime;
import java.util.UUID;

public record QuickNoteDto(
        UUID id,
        String content,
        String noteType,
        String mediaUrl,
        OffsetDateTime createdAt
) {
    public static QuickNoteDto from(QuickNote note) {
        return new QuickNoteDto(
                note.getId(),
                note.getContent(),
                note.getNoteType().name().toLowerCase(),
                note.getMediaUrl(),
                note.getCreatedAt()
        );
    }
}
