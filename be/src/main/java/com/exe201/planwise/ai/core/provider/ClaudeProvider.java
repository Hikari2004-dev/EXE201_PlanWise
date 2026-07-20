package com.exe201.planwise.ai.core.provider;

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
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class ClaudeProvider implements AIProvider {

    private final ObjectMapper objectMapper;

    @Value("${app.ai.claude.url}")
    private String claudeUrl;

    @Value("${app.ai.claude.api-key}")
    private String apiKey;

    @Value("${app.ai.claude.model}")
    private String model;

    @Value("${app.ai.claude.max-tokens:100000}")
    private int maxTokens;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Override
    public String chat(String prompt) {

        try {

            String body = objectMapper.writeValueAsString(
                    Map.of(
                            "model", model,
                            "max_tokens", maxTokens,
                            "messages", List.of(
                                    Map.of(
                                            "role", "user",
                                            "content", prompt
                                    )
                            )
                    )
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(claudeUrl))
                    .header("Content-Type", "application/json")
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", "2023-06-01")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Không thể tạo kế hoạch AI: " + response.body());
            }

            ClaudeResponse claudeResponse = objectMapper.readValue(response.body(), ClaudeResponse.class);

            return claudeResponse.content().get(0).text();

        } catch (AppException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new AppException(ErrorCode.AI_SERVICE_ERROR,"Lỗi khi gọi dịch vụ AI"+ ex.getMessage());
        }
    }

    @Override
    public String generateGoalRoadmap(String prompt) {
        return chat(prompt);
    }

    private record ClaudeResponse(List<ClaudeContent> content) {}

    private record ClaudeContent(String type, String text) {}

}
