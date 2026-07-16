package com.exe201.planwise.ai.features.goal.parser;

import com.exe201.planwise.ai.core.parser.JsonResponseExtractor;
import com.exe201.planwise.ai.features.goal.dto.GoalRoadmapDraft;
import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class GoalDraftParser {

    private final ObjectMapper objectMapper;
    private final JsonResponseExtractor jsonResponseExtractor;

    public GoalRoadmapDraft parse(String rawResponse) {
        try {
            return objectMapper.readValue(jsonResponseExtractor.extractObject(rawResponse), GoalRoadmapDraft.class);
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
}
