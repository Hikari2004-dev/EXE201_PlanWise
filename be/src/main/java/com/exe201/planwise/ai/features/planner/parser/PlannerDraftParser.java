package com.exe201.planwise.ai.features.planner.parser;

import com.exe201.planwise.ai.core.parser.JsonResponseExtractor;
import com.exe201.planwise.ai.features.planner.dto.PlannerDraftPlan;
import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
@RequiredArgsConstructor
public class PlannerDraftParser {

    private final ObjectMapper objectMapper;
    private final JsonResponseExtractor jsonResponseExtractor;

    public PlannerDraftPlan parse(String rawResponse) {
        try {
            return objectMapper.readValue(jsonResponseExtractor.extractObject(rawResponse), PlannerDraftPlan.class);
        } catch (Exception ex) {
            throw new AppException(ErrorCode.AI_DRAFT_INVALID, "AI trả về JSON lập kế hoạch không hợp lệ");
        }
    }

    public String toJson(PlannerDraftPlan plan) {
        try {
            return objectMapper.writeValueAsString(plan);
        } catch (Exception ex) {
            throw new AppException(ErrorCode.AI_DRAFT_INVALID, "Không thể lưu bản nháp lập kế hoạch");
        }
    }

    public PlannerDraftPlan fromJson(String json) {
        try {
            return objectMapper.readValue(json, PlannerDraftPlan.class);
        } catch (Exception ex) {
            throw new AppException(ErrorCode.AI_DRAFT_INVALID, "Bản nháp lập kế hoạch không hợp lệ");
        }
    }
}
