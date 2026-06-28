package com.exe201.planwise.vision.service;

import com.exe201.planwise.config.AppProperties;
import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import com.exe201.planwise.vision.dto.PresignVisionImageUploadRequest;
import com.exe201.planwise.vision.dto.PresignVisionImageUploadResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.net.URI;
import java.time.Duration;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VisionImageUploadService {

    private final AppProperties appProperties;

    public PresignVisionImageUploadResponse presignUpload(UUID userId, PresignVisionImageUploadRequest request) {
        AppProperties.R2 r2 = appProperties.getR2();

        if (!r2.isEnabled()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Tải ảnh Vision hiện chưa được cấu hình");
        }
        if (r2.getEndpoint() == null || r2.getEndpoint().isBlank() || r2.getBucket() == null || r2.getBucket().isBlank()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Thiếu cấu hình Cloudflare R2");
        }
        if (r2.getPublicBaseUrl() == null || r2.getPublicBaseUrl().isBlank()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Thiếu public base URL cho Cloudflare R2");
        }
        if (request.sizeBytes() > r2.getMaxUploadSizeBytes()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Ảnh vượt quá kích thước cho phép");
        }
        if (!request.contentType().toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Chỉ hỗ trợ tệp hình ảnh");
        }

        String objectKey = buildObjectKey(userId, request.filename());
        String publicUrl = buildPublicUrl(r2.getPublicBaseUrl(), objectKey);

        AwsBasicCredentials credentials = AwsBasicCredentials.create(r2.getAccessKeyId(), r2.getSecretAccessKey());
        try (S3Presigner presigner = S3Presigner.builder()
                .endpointOverride(URI.create(r2.getEndpoint()))
                .region(Region.of(r2.getRegion()))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
                .build()) {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(r2.getBucket())
                    .key(objectKey)
                    .contentType(request.contentType())
                    .build();

            PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofSeconds(r2.getPresignTtlSeconds()))
                    .putObjectRequest(putObjectRequest)
                    .build();

            String uploadUrl = presigner.presignPutObject(presignRequest).url().toString();
            return new PresignVisionImageUploadResponse(uploadUrl, publicUrl, objectKey);
        }
    }

    private String buildObjectKey(UUID userId, String filename) {
        String sanitizedFilename = sanitizeFilename(filename);
        return "vision/" + userId + "/" + UUID.randomUUID() + "-" + sanitizedFilename;
    }

    private String sanitizeFilename(String filename) {
        String safe = filename == null ? "image" : filename.trim().toLowerCase(Locale.ROOT);
        safe = safe.replaceAll("[^a-z0-9._-]", "-");
        safe = safe.replaceAll("-+", "-");
        return safe.isBlank() ? "image" : safe;
    }

    private String buildPublicUrl(String publicBaseUrl, String objectKey) {
        return publicBaseUrl.endsWith("/") ? publicBaseUrl + objectKey : publicBaseUrl + "/" + objectKey;
    }
}
