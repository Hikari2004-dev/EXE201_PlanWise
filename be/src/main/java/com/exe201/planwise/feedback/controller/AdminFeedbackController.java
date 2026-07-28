package com.exe201.planwise.feedback.controller;

import com.exe201.planwise.feedback.dto.FeedbackResponse;
import com.exe201.planwise.feedback.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/feedbacks")
@RequiredArgsConstructor
public class AdminFeedbackController {

    private final FeedbackService feedbackService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<FeedbackResponse>> getRecentFeedbacks(
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(feedbackService.getRecentFeedbacks(limit));
    }
}
