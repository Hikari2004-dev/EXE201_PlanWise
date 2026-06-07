package com.exe201.planwise.notification.controller;

import com.exe201.planwise.notification.dto.NotificationDto;
import com.exe201.planwise.notification.dto.UpdateNotificationRequest;
import com.exe201.planwise.notification.service.NotificationService;
import com.exe201.planwise.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationDto>> getNotifications(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(notificationService.getNotifications(principal.getId()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(principal.getId())));
    }

    @PatchMapping("/{notificationId}")
    public ResponseEntity<NotificationDto> updateNotification(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID notificationId,
            @Valid @RequestBody UpdateNotificationRequest request) {
        return ResponseEntity.ok(notificationService.updateNotification(principal.getId(), notificationId, request.read(), request.dismissed()));
    }

    @PatchMapping
    public ResponseEntity<Void> updateAllNotifications(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateNotificationRequest request) {
        if (Boolean.TRUE.equals(request.read()) && Boolean.FALSE.equals(request.dismissed())) {
            notificationService.markAllAsRead(principal.getId());
        } else if (Boolean.TRUE.equals(request.dismissed()) && Boolean.FALSE.equals(request.read())) {
            notificationService.dismissAll(principal.getId());
        }
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> deleteNotification(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID notificationId) {
        notificationService.dismissNotification(principal.getId(), notificationId);
        return ResponseEntity.noContent().build();
    }
}
