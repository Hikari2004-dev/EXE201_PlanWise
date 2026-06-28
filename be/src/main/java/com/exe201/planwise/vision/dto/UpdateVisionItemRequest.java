package com.exe201.planwise.vision.dto;

import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateVisionItemRequest(
        @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
        String title,

        String description,

        UUID categoryId,

        String imageUrl,

        String quote,

        Integer sortOrder
) {}
