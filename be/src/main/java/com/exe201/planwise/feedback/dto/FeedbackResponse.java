package com.exe201.planwise.feedback.dto;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class FeedbackResponse {
    private UUID id;
    private String userName;
    private String userEmail;
    private int rating;
    private String comment;
    private OffsetDateTime createdAt;
}
