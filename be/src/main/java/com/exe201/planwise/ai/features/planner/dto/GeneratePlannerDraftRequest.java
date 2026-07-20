package com.exe201.planwise.ai.features.planner.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record GeneratePlannerDraftRequest(
        @NotBlank(message = "Yeu cau lap ke hoach khong duoc de trong")
        @Size(max = 4000, message = "Yeu cau lap ke hoach khong duoc vuot qua 4000 ky tu")
        String message,

        String constraints,

        LocalDate startDate,

        LocalDate endDate
) {}
