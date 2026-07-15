package com.exe201.planwise.ai.features.planner.parser;

import com.exe201.planwise.ai.core.parser.JsonResponseExtractor;
import com.exe201.planwise.ai.features.planner.dto.PlannerDraftPlan;
import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class PlannerDraftParser {

    private static final Pattern UUID_FIELD_PATTERN = Pattern.compile(
            "\"(existingTaskId|categoryId|goalId|milestoneId)\"\\s*:\\s*\"([^\"]*)\""
    );
    private static final Pattern UUID_VALUE_PATTERN = Pattern.compile(
            "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
    );
    private static final Pattern LEADING_DECIMAL_PATTERN = Pattern.compile("(:\\s*)\\.(\\d+)");

    private final ObjectMapper objectMapper;
    private final JsonResponseExtractor jsonResponseExtractor;

    public PlannerDraftPlan parse(String rawResponse) {
        try {
            String json = sanitizePlannerJson(jsonResponseExtractor.extractObject(rawResponse));
            return objectMapper.readValue(json, PlannerDraftPlan.class);
        } catch (AppException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Planner AI response could not be parsed: {}", ex.getMessage());
            log.debug("Raw planner AI response: {}", rawResponse, ex);
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

    private String sanitizePlannerJson(String json) {
        String sanitized = json
                .replace("\"isRecuring\"", "\"isRecurring\"")
                .replace("\"isReccuring\"", "\"isRecurring\"");
        return sanitizeLeadingDecimals(sanitizeUuidFields(sanitized));
    }

    private String sanitizeUuidFields(String json) {
        Matcher matcher = UUID_FIELD_PATTERN.matcher(json);
        StringBuilder sanitized = new StringBuilder();
        while (matcher.find()) {
            String value = matcher.group(2).trim();
            if (!UUID_VALUE_PATTERN.matcher(value).matches()) {
                String replacement = "\"" + matcher.group(1) + "\": null";
                matcher.appendReplacement(sanitized, Matcher.quoteReplacement(replacement));
            }
        }
        matcher.appendTail(sanitized);
        return sanitized.toString();
    }

    private String sanitizeLeadingDecimals(String json) {
        Matcher matcher = LEADING_DECIMAL_PATTERN.matcher(json);
        StringBuilder sanitized = new StringBuilder();
        while (matcher.find()) {
            String replacement = matcher.group(1) + "0." + matcher.group(2);
            matcher.appendReplacement(sanitized, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(sanitized);
        return sanitized.toString();
    }
}
