package com.exe201.planwise.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;

public record CreateNotificationRequest(
        @NotBlank(message = "Loại thông báo không được để trống")
        String type,

        String tone,

        @NotBlank(message = "Tiêu đề không được để trống")
        @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
        String title,

        @NotBlank(message = "Nội dung không được để trống")
        String message,

        String ctaLabel,

        OffsetDateTime scheduledFor
) {
    public CreateNotificationRequest {
        if (tone == null || tone.isBlank()) tone = "indigo";
    }
}
