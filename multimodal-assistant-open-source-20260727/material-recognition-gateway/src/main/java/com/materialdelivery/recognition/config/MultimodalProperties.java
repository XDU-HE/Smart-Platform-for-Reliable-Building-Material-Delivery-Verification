package com.materialdelivery.recognition.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "multimodal")
public record MultimodalProperties(
        String provider,
        String baseUrl,
        String apiKey,
        String model,
        int timeoutSeconds,
        int maxPdfPages,
        List<String> allowedOrigins) {

    public MultimodalProperties {
        provider = valueOrDefault(provider, "openai-compatible");
        baseUrl = valueOrDefault(baseUrl, "");
        apiKey = valueOrDefault(apiKey, "");
        model = valueOrDefault(model, "qwen3.6-35b-a3b");
        timeoutSeconds = timeoutSeconds > 0 ? timeoutSeconds : 60;
        maxPdfPages = maxPdfPages > 0 ? maxPdfPages : 3;
        allowedOrigins = allowedOrigins == null || allowedOrigins.isEmpty()
                ? List.of(
                        "http://localhost:5173",
                        "http://127.0.0.1:5173",
                        "http://localhost:4173",
                        "http://127.0.0.1:4173")
                : List.copyOf(allowedOrigins);
    }

    public boolean configured() {
        return !baseUrl.isBlank()
                && !apiKey.isBlank()
                && !apiKey.equals("YOUR_API_KEY")
                && !baseUrl.contains("YOUR_WORKSPACE_ID");
    }

    public String chatCompletionsUrl() {
        return baseUrl.replaceAll("/+$", "") + "/chat/completions";
    }

    private static String valueOrDefault(String value, String fallback) {
        return value == null ? fallback : value.trim();
    }
}
