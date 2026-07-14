package com.exe201.planwise.ai.core.prompt;

import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.Map;
import java.util.stream.Collectors;

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

    public String loadAndRender(String fileName, Map<String, ?> variables) {
        return render(load(fileName), variables);
    }

    public String render(String template, Map<String, ?> variables) {
        String rendered = template;
        for (Map.Entry<String, ?> entry : variables.entrySet()) {
            rendered = rendered.replace("{{" + entry.getKey() + "}}", stringify(entry.getValue()));
        }
        return rendered;
    }

    private String stringify(Object value) {
        if (value == null) {
            return "";
        }
        if (value instanceof Collection<?> collection) {
            return collection.stream()
                    .map(this::stringify)
                    .collect(Collectors.joining("; "));
        }
        return value.toString();
    }
}
