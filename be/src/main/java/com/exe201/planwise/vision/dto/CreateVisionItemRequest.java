package com.exe201.planwise.vision.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateVisionItemRequest(
        @NotBlank(message = "Tiêu đề không được để trống")
        @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
        String title,

        String description,

        @NotNull(message = "Danh mục không được để trống")
        UUID categoryId,

        String imageUrl,

        String quote
) {}
