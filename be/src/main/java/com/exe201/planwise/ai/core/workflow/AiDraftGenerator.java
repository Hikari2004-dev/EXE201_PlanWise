package com.exe201.planwise.ai.core.workflow;

import com.exe201.planwise.ai.core.prompt.PromptLoader;
import com.exe201.planwise.ai.core.provider.AIProvider;
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
            Consumer<T> validator) {
        String prompt = promptLoader.loadAndRender(promptFile, variables);
        T draft = parser.apply(aiProvider.chat(prompt));
        T normalizedDraft = normalizer.apply(draft);
        validator.accept(normalizedDraft);
        return normalizedDraft;
    }
}
