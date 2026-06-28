package com.exe201.planwise.vision.dto;

public record PresignVisionImageUploadResponse(
        String uploadUrl,
        String publicUrl,
        String objectKey
) {
}
