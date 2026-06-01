package com.exe201.planwise.event.service;

import com.exe201.planwise.category.entity.Category;
import com.exe201.planwise.category.repository.CategoryRepository;
import com.exe201.planwise.event.dto.*;
import com.exe201.planwise.event.entity.CalendarEvent;
import com.exe201.planwise.event.repository.CalendarEventRepository;
import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import com.exe201.planwise.user.entity.User;
import com.exe201.planwise.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class CalendarEventService {

    private final CalendarEventRepository eventRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<CalendarEventDto> getEvents(UUID userId) {
        return eventRepository.findByUserIdOrderByEventDateAscStartHourAsc(userId)
                .stream().map(CalendarEventDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<CalendarEventDto> getEventsByDate(UUID userId, LocalDate date) {
        return eventRepository.findByUserIdAndEventDate(userId, date)
                .stream().map(CalendarEventDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<CalendarEventDto> getEventsByDateRange(UUID userId, LocalDate startDate, LocalDate endDate) {
        return eventRepository.findByUserIdAndDateRange(userId, startDate, endDate)
                .stream().map(CalendarEventDto::from).toList();
    }

    @Transactional(readOnly = true)
    public CalendarEventDto getEventById(UUID userId, UUID eventId) {
        CalendarEvent event = findEventAndValidateOwnership(eventId, userId);
        return CalendarEventDto.from(event);
    }

    @Transactional
    public CalendarEventDto createEvent(UUID userId, CreateEventRequest request) {
        User user = findUser(userId);
        Category category = null;

        if (request.categoryId() != null) {
            category = categoryRepository.findById(request.categoryId())
                    .filter(c -> c.getUser().getId().equals(userId))
                    .orElse(null);
        }

        CalendarEvent event = CalendarEvent.builder()
                .user(user)
                .category(category)
                .title(request.title())
                .eventDate(request.eventDate())
                .startHour(request.startHour())
                .startMin(request.startMin())
                .duration(request.duration())
                .color(request.color())
                .location(request.location())
                .notes(request.notes())
                .isRecurring(request.isRecurring())
                .recurrenceRule(request.recurrenceRule())
                .build();

        event = eventRepository.save(event);
        log.info("Created event {} for user {}", event.getId(), userId);

        return CalendarEventDto.from(event);
    }

    @Transactional
    public CalendarEventDto updateEvent(UUID userId, UUID eventId, UpdateEventRequest request) {
        CalendarEvent event = findEventAndValidateOwnership(eventId, userId);

        if (request.title() != null) {
            event.setTitle(request.title());
        }
        if (request.eventDate() != null) {
            event.setEventDate(request.eventDate());
        }
        if (request.startHour() != null) {
            event.setStartHour(request.startHour());
        }
        if (request.startMin() != null) {
            event.setStartMin(request.startMin());
        }
        if (request.duration() != null) {
            event.setDuration(request.duration());
        }
        if (request.color() != null) {
            event.setColor(request.color());
        }
        if (request.location() != null) {
            event.setLocation(request.location());
        }
        if (request.notes() != null) {
            event.setNotes(request.notes());
        }
        if (request.categoryId() != null) {
            Category category = categoryRepository.findById(request.categoryId())
                    .filter(c -> c.getUser().getId().equals(userId))
                    .orElse(null);
            event.setCategory(category);
        }
        if (request.isRecurring() != null) {
            event.setRecurring(request.isRecurring());
        }
        if (request.recurrenceRule() != null) {
            event.setRecurrenceRule(request.recurrenceRule());
        }

        event = eventRepository.save(event);
        return CalendarEventDto.from(event);
    }

    @Transactional
    public void deleteEvent(UUID userId, UUID eventId) {
        CalendarEvent event = findEventAndValidateOwnership(eventId, userId);
        eventRepository.delete(event);
        log.info("Deleted event {} for user {}", eventId, userId);
    }

    private User findUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private CalendarEvent findEventAndValidateOwnership(UUID eventId, UUID userId) {
        CalendarEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new AppException(ErrorCode.EVENT_NOT_FOUND));

        if (!event.getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.EVENT_NOT_FOUND);
        }
        return event;
    }
}
