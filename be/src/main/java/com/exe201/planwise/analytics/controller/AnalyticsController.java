package com.exe201.planwise.analytics.controller;

import com.exe201.planwise.analytics.dto.AnalyticsResponse;
import com.exe201.planwise.analytics.service.AnalyticsService;
import com.exe201.planwise.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * GET /api/v1/analytics
     * Lấy dữ liệu phân tích của người dùng.
     * Chỉ dành cho PREMIUM users. FREE users sẽ nhận được response với isPremium=false.
     */
    @GetMapping
    public ResponseEntity<AnalyticsResponse> getAnalytics(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(analyticsService.getAnalytics(principal.getId()));
    }
}
