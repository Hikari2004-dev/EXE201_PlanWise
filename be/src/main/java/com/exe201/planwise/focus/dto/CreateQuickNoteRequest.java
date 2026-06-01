package com.exe201.planwise.focus.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateQuickNoteRequest(
        @NotBlank(message = "Nội dung không được để trống")
        String content,

        String noteType,

        String mediaUrl
) {
    public CreateQuickNoteRequest {
        if (noteType == null || noteType.isBlank()) noteType = "text";
    }
}
