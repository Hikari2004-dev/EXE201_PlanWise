package com.exe201.planwise.ai.parser;

import com.exe201.planwise.ai.dto.GoalRoadmapDraft;
import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class GoalDraftParser {

    private final ObjectMapper objectMapper;

    public GoalRoadmapDraft parse(String rawResponse) {
        try {
            return objectMapper.readValue(extractJson(rawResponse), GoalRoadmapDraft.class);
        } catch (Exception ex) {
            throw new AppException(ErrorCode.AI_DRAFT_INVALID, "AI trả về JSON không hợp lệ");
        }
    }

    public String toJson(GoalRoadmapDraft draft) {
        try {
            return objectMapper.writeValueAsString(draft);
        } catch (Exception ex) {
            throw new AppException(ErrorCode.AI_DRAFT_INVALID, "Không thể lưu bản nháp AI");
        }
    }

    public GoalRoadmapDraft fromJson(String json) {
        try {
            return objectMapper.readValue(json, GoalRoadmapDraft.class);
        } catch (Exception ex) {
            throw new AppException(ErrorCode.AI_DRAFT_INVALID, "Bản nháp AI không hợp lệ");
        }
    }

    private String extractJson(String value) {
        if (value == null || value.isBlank()) {
            throw new AppException(ErrorCode.AI_DRAFT_INVALID, "AI không trả về nội dung");
        }

        String trimmed = value.trim();
        if (trimmed.startsWith("```")) {
            trimmed = trimmed.replaceFirst("^```(?:json)?", "").replaceFirst("```$", "").trim();
        }

        int firstBrace = trimmed.indexOf('{');
        int lastBrace = trimmed.lastIndexOf('}');
        if (firstBrace < 0 || lastBrace <= firstBrace) {
            throw new AppException(ErrorCode.AI_DRAFT_INVALID, "AI không trả về JSON object");
        }
        return trimmed.substring(firstBrace, lastBrace + 1);
    }
}
