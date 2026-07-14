package com.exe201.planwise.ai.features.planner.dto;

import com.exe201.planwise.event.dto.CalendarEventDto;
import com.exe201.planwise.habit.dto.HabitDto;
import com.exe201.planwise.task.dto.TaskDto;

import java.util.List;

public record PlannerApprovalResponse(
        List<CalendarEventDto> events,
        List<TaskDto> tasks,
        List<HabitDto> habits
) {}
