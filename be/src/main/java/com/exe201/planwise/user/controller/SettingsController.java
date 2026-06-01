package com.exe201.planwise.user.controller;

import com.exe201.planwise.security.UserPrincipal;
import com.exe201.planwise.user.dto.UpdateSettingsRequest;
import com.exe201.planwise.user.dto.UserSettingsDto;
import com.exe201.planwise.user.service.SettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;

    @GetMapping
    public ResponseEntity<UserSettingsDto> getSettings(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(settingsService.getSettings(principal.getId()));
    }

    @PutMapping
    public ResponseEntity<UserSettingsDto> updateSettings(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateSettingsRequest request) {
        return ResponseEntity.ok(settingsService.updateSettings(principal.getId(), request));
    }
}
