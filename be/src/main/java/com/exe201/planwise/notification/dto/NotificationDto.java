package com.exe201.planwise.notification.dto;

import com.exe201.planwise.notification.entity.Notification;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.UUID;

public record NotificationDto(
        UUID id,
        String type,
        String tone,
        String title,
        String message,
        String ctaLabel,
        boolean read,
        boolean dismissed,
        OffsetDateTime scheduledFor,
        OffsetDateTime createdAt
) {
    public static NotificationDto from(Notification notification) {
        return new NotificationDto(
                notification.getId(),
                notification.getType().name().toLowerCase(),
                notification.getTone().name().toLowerCase(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getCtaLabel(),
                notification.isRead(),
                notification.isDismissed(),
                notification.getScheduledFor(),
                notification.getCreatedAt()
        );
    }
}
