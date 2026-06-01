package com.exe201.planwise.notification.controller;

import com.exe201.planwise.notification.dto.*;
import com.exe201.planwise.notification.service.NotificationService;
import com.exe201.planwise.security.UserPrincipal;
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

    @PostMapping("/{notificationId}/read")
    public ResponseEntity<NotificationDto> markAsRead(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID notificationId) {
        return ResponseEntity.ok(notificationService.markAsRead(principal.getId(), notificationId));
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAllAsRead(principal.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> dismissNotification(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID notificationId) {
        notificationService.dismissNotification(principal.getId(), notificationId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/dismiss-all")
    public ResponseEntity<Void> dismissAll(
            @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.dismissAll(principal.getId());
        return ResponseEntity.noContent().build();
    }
}
