package com.exe201.planwise.reflection.controller;

import com.exe201.planwise.reflection.dto.*;
import com.exe201.planwise.reflection.service.ReflectionService;
import com.exe201.planwise.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reflections")
@RequiredArgsConstructor
public class ReflectionController {

    private final ReflectionService reflectionService;

    @GetMapping
    public ResponseEntity<List<DailyReflectionDto>> getReflections(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(reflectionService.getReflections(principal.getId()));
    }

    @GetMapping("/today")
    public ResponseEntity<DailyReflectionDto> getTodayReflection(
            @AuthenticationPrincipal UserPrincipal principal) {
        DailyReflectionDto reflection = reflectionService.getReflectionByDate(principal.getId(), LocalDate.now());
        return ResponseEntity.ok(reflection);
    }

    @GetMapping("/date")
    public ResponseEntity<DailyReflectionDto> getReflectionByDate(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        DailyReflectionDto reflection = reflectionService.getReflectionByDate(principal.getId(), date);
        return ResponseEntity.ok(reflection);
    }

    @PostMapping
    public ResponseEntity<DailyReflectionDto> createOrUpdateReflection(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateReflectionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reflectionService.createOrUpdateReflection(principal.getId(), request));
    }

    @PutMapping("/{reflectionId}")
    public ResponseEntity<DailyReflectionDto> updateReflection(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID reflectionId,
            @Valid @RequestBody UpdateReflectionRequest request) {
        return ResponseEntity.ok(reflectionService.updateReflection(principal.getId(), reflectionId, request));
    }
}
