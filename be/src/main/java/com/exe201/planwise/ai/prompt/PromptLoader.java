package com.exe201.planwise.ai.prompt;

import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

@Component
public class PromptLoader {

    public String load(String fileName) {
        try {
            ClassPathResource resource = new ClassPathResource("prompts/" + fileName);
            return resource.getContentAsString(StandardCharsets.UTF_8);
        } catch (Exception ex) {
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Không tìm thấy prompt AI");
        }
    }
}
