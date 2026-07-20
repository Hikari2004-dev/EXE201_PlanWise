package com.exe201.planwise.ai.core.parser;

import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import org.springframework.stereotype.Component;

@Component
public class JsonResponseExtractor {

    public String extractObject(String value) {
        if (value == null || value.isBlank()) {
            throw new AppException(ErrorCode.AI_DRAFT_INVALID, "AI khong tra ve noi dung");
        }

        String trimmed = stripCodeFence(value.trim());
        int firstBrace = trimmed.indexOf('{');
        int lastBrace = trimmed.lastIndexOf('}');
        if (firstBrace < 0 || lastBrace <= firstBrace) {
            throw new AppException(ErrorCode.AI_DRAFT_INVALID, "AI khong tra ve JSON object");
        }

        return trimmed.substring(firstBrace, lastBrace + 1);
    }

    private String stripCodeFence(String value) {
        if (!value.startsWith("```")) {
            return value;
        }
        return value
                .replaceFirst("^```(?:json)?", "")
                .replaceFirst("```$", "")
                .trim();
    }
}
