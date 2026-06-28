package com.exe201.planwise.vision.controller;

import com.exe201.planwise.vision.dto.*;
import com.exe201.planwise.vision.service.VisionService;
import com.exe201.planwise.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/vision")
@RequiredArgsConstructor
public class VisionController {

    private final VisionService visionService;

    @GetMapping
    public ResponseEntity<List<VisionItemDto>> getVisionItems(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(visionService.getVisionItems(principal.getId()));
    }

    @PostMapping("/images/presign")
    public ResponseEntity<PresignVisionImageUploadResponse> presignVisionImageUpload(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody PresignVisionImageUploadRequest request) {
        return ResponseEntity.ok(visionService.presignVisionImageUpload(principal.getId(), request));
    }

    @PostMapping
    public ResponseEntity<VisionItemDto> createVisionItem(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateVisionItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(visionService.createVisionItem(principal.getId(), request));
    }

    @PutMapping("/{itemId}")
    public ResponseEntity<VisionItemDto> updateVisionItem(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID itemId,
            @Valid @RequestBody UpdateVisionItemRequest request) {
        return ResponseEntity.ok(visionService.updateVisionItem(principal.getId(), itemId, request));
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<Void> deleteVisionItem(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID itemId) {
        visionService.deleteVisionItem(principal.getId(), itemId);
        return ResponseEntity.noContent().build();
    }
}
