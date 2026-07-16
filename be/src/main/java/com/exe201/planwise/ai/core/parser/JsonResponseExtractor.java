package com.exe201.planwise.ai.core.parser;

import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import org.springframework.stereotype.Component;

@Component
public class JsonResponseExtractor {

    public String extractObject(String value) {
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
