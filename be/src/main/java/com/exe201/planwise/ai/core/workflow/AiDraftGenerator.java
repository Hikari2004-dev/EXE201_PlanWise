package com.exe201.planwise.ai.core.workflow;

import com.exe201.planwise.ai.prompt.PromptLoader;
import com.exe201.planwise.ai.provider.AIProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.function.UnaryOperator;

@Component
@RequiredArgsConstructor
public class AiDraftGenerator {

    private final AIProvider aiProvider;
    private final PromptLoader promptLoader;

    public <T> T generateDraft(
            String promptFile,
            Map<String, ?> variables,
            Function<String, T> parser,
            UnaryOperator<T> normalizer,
            Consumer<T> validator
    ) {
        T draft = parser.apply(aiProvider.chat(injectVariables(promptLoader.load(promptFile), variables)));
        draft = normalizer.apply(draft);
        validator.accept(draft);
        return draft;
    }

    private String injectVariables(String template, Map<String, ?> variables) {
        String prompt = template;
        for (Map.Entry<String, ?> entry : variables.entrySet()) {
            prompt = prompt.replace("{{" + entry.getKey() + "}}", toString(entry.getValue()));
        }
        return prompt;
    }

    private String toString(Object value) {
        return value == null ? "" : value.toString();
    }
}
