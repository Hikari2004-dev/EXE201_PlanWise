package com.exe201.planwise.feedback.service;

import com.exe201.planwise.feedback.dto.FeedbackRequest;
import com.exe201.planwise.feedback.dto.FeedbackResponse;
import com.exe201.planwise.feedback.entity.Feedback;
import com.exe201.planwise.feedback.repository.FeedbackRepository;
import com.exe201.planwise.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;

    @Transactional
    public FeedbackResponse submitFeedback(User user, FeedbackRequest request) {
        Feedback feedback = Feedback.builder()
                .user(user)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();
        
        feedback = feedbackRepository.save(feedback);
        return mapToResponse(feedback);
    }

    @Transactional(readOnly = true)
    public List<FeedbackResponse> getRecentFeedbacks(int limit) {
        Page<Feedback> page = feedbackRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, limit));
        return page.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private FeedbackResponse mapToResponse(Feedback feedback) {
        return FeedbackResponse.builder()
                .id(feedback.getId())
                .userName(feedback.getUser().getFullName())
                .userEmail(feedback.getUser().getEmail())
                .rating(feedback.getRating())
                .comment(feedback.getComment())
                .createdAt(feedback.getCreatedAt())
                .build();
    }
}
