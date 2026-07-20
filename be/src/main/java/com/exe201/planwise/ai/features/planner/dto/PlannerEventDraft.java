package com.exe201.planwise.ai.features.planner.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record PlannerEventDraft(
        @NotBlank(message = "Tieu de su kien khong duoc de trong")
        @Size(max = 255, message = "Tieu de su kien khong duoc vuot qua 255 ky tu")
        String title,

        LocalDate eventDate,

        Integer startHour,

        Integer startMin,

        Double duration,

        String location,

        String notes,

        UUID categoryId,

        Boolean isRecurring,

        String recurrenceRule
) {
    public PlannerEventDraft {
        if (startMin == null) startMin = 0;
        if (isRecurring == null) isRecurring = false;
    }
}
