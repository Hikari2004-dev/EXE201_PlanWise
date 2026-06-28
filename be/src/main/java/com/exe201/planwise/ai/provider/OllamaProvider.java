package com.exe201.planwise.ai.provider;

import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class OllamaProvider implements AIProvider {

    private final ObjectMapper objectMapper;

    @Value("${app.ai.ollama.url:http://localhost:11434}")
    private String ollamaUrl;

    @Value("${app.ai.ollama.model:qwen3:8b}")
    private String model;

    @Override
    public String chat(String prompt) {
        try {
            String body = objectMapper.writeValueAsString(Map.of(
                    "model", model,
                    "messages", java.util.List.of(Map.of(
                            "role", "user",
                            "content", prompt
                    )),
                    "stream", false,
                    "format", "json"
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(ollamaUrl + "/api/chat"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Không thể tạo kế hoạch AI");
            }

            OllamaChatResponse ollamaResponse = objectMapper.readValue(response.body(), OllamaChatResponse.class);
            return ollamaResponse.message().content();
        } catch (AppException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Không thể kết nối AI provider");
        }
    }

    @Override
    public String generateGoalRoadmap(String prompt) {
        return chat(prompt);
    }

    private record OllamaChatResponse(OllamaMessage message) {}

    private record OllamaMessage(String content) {}
}
