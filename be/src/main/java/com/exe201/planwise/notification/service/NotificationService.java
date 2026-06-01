package com.exe201.planwise.notification.service;

import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import com.exe201.planwise.notification.dto.*;
import com.exe201.planwise.notification.entity.Notification;
import com.exe201.planwise.notification.repository.NotificationRepository;
import com.exe201.planwise.user.entity.User;
import com.exe201.planwise.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<NotificationDto> getNotifications(UUID userId) {
        return notificationRepository.findByUserIdAndDismissedFalseOrderByCreatedAtDesc(userId)
                .stream().map(NotificationDto::from).toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countUnreadByUserId(userId);
    }

    @Transactional
    public NotificationDto markAsRead(UUID userId, UUID notificationId) {
        Notification notification = findNotificationAndValidateOwnership(notificationId, userId);
        notification.setRead(true);
        notification = notificationRepository.save(notification);
        return NotificationDto.from(notification);
    }

    @Transactional
    public void markAllAsRead(UUID userId) {
        notificationRepository.markAllAsReadByUserId(userId);
    }

    @Transactional
    public void dismissNotification(UUID userId, UUID notificationId) {
        Notification notification = findNotificationAndValidateOwnership(notificationId, userId);
        notification.setDismissed(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void dismissAll(UUID userId) {
        notificationRepository.dismissAllByUserId(userId);
    }

    @Transactional
    public NotificationDto createNotification(UUID userId, CreateNotificationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Notification.NotificationType type;
        try {
            type = Notification.NotificationType.valueOf(request.type().toLowerCase());
        } catch (IllegalArgumentException e) {
            type = Notification.NotificationType.time;
        }

        Notification.NotificationTone tone;
        try {
            tone = Notification.NotificationTone.valueOf(request.tone().toLowerCase());
        } catch (IllegalArgumentException e) {
            tone = Notification.NotificationTone.INDIGO;
        }

        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .tone(tone)
                .title(request.title())
                .message(request.message())
                .ctaLabel(request.ctaLabel())
                .scheduledFor(request.scheduledFor())
                .build();

        notification = notificationRepository.save(notification);
        return NotificationDto.from(notification);
    }

    private Notification findNotificationAndValidateOwnership(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new AppException(ErrorCode.NOTIFICATION_NOT_FOUND));

        if (!notification.getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.NOTIFICATION_NOT_FOUND);
        }
        return notification;
    }
}
