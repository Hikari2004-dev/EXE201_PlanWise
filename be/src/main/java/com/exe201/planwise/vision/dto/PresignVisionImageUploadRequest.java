package com.exe201.planwise.vision.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record PresignVisionImageUploadRequest(
        @NotBlank(message = "Tên tệp không được để trống")
        String filename,

        @NotBlank(message = "Kiểu tệp không được để trống")
        String contentType,

        @Positive(message = "Kích thước tệp phải lớn hơn 0")
        long sizeBytes
) {
}
