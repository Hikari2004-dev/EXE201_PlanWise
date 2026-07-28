package com.exe201.planwise.feedback.controller;

import com.exe201.planwise.feedback.dto.FeedbackRequest;
import com.exe201.planwise.feedback.dto.FeedbackResponse;
import com.exe201.planwise.feedback.service.FeedbackService;
import com.exe201.planwise.security.UserPrincipal;
import com.exe201.planwise.user.entity.User;
import com.exe201.planwise.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/feedbacks")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;
    private final UserRepository userRepository;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FeedbackResponse submitFeedback(
            @AuthenticationPrincipal UserPrincipal principal, 
            @Valid @RequestBody FeedbackRequest request) {
        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> new RuntimeException("User not found"));
        return feedbackService.submitFeedback(user, request);
    }
}
