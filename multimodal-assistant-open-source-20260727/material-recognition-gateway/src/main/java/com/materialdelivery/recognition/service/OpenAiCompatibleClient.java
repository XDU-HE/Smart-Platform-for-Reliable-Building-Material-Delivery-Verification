package com.materialdelivery.recognition.service;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.databind.JsonNode;
import com.materialdelivery.recognition.config.MultimodalProperties;
import com.materialdelivery.recognition.exception.RecognitionGatewayException;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class OpenAiCompatibleClient {

    private final MultimodalProperties properties;
    private final ModelResponseParser responseParser;
    private final RestClient restClient;

    public OpenAiCompatibleClient(
            MultimodalProperties properties,
            ModelResponseParser responseParser,
            RestClient.Builder restClientBuilder) {
        this.properties = properties;
        this.responseParser = responseParser;
        Duration timeout = Duration.ofSeconds(properties.timeoutSeconds());
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(timeout)
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(timeout);
        this.restClient = restClientBuilder.requestFactory(requestFactory).build();
    }

    public ModelRecognitionPayload recognize(String prompt, List<EvidenceImage> images) {
        if (!properties.configured()) {
            throw new RecognitionGatewayException("GATEWAY_NOT_CONFIGURED", "多模态模型配置未完成");
        }

        List<Map<String, Object>> content = new ArrayList<>();
        content.add(Map.of("type", "text", "text", prompt));
        for (EvidenceImage image : images) {
            content.add(Map.of(
                    "type", "image_url",
                    "image_url", Map.of("url", image.dataUrl())));
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", properties.model());
        body.put("messages", List.of(Map.of("role", "user", "content", content)));
        body.put("temperature", 0.1);
        body.put("enable_thinking", false);
        body.put("response_format", Map.of("type", "json_object"));

        try {
            JsonNode response = restClient.post()
                    .uri(properties.chatCompletionsUrl())
                    .contentType(MediaType.APPLICATION_JSON)
                    .headers(headers -> headers.setBearerAuth(properties.apiKey()))
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);

            String contentText = extractContent(response);
            return responseParser.parse(contentText);
        } catch (RecognitionGatewayException exception) {
            throw exception;
        } catch (RestClientException exception) {
            throw new RecognitionGatewayException(
                    "MODEL_REQUEST_FAILED",
                    "多模态模型请求失败，请检查网关配置或稍后重试",
                    exception);
        }
    }

    private String extractContent(JsonNode response) {
        if (response == null) {
            throw new RecognitionGatewayException("MODEL_RESPONSE_INVALID", "模型响应为空");
        }

        JsonNode content = response.path("choices").path(0).path("message").path("content");
        if (content.isTextual()) {
            return content.asText();
        }
        if (content.isArray()) {
            for (JsonNode item : content) {
                JsonNode text = item.path("text");
                if (text.isTextual()) {
                    return text.asText();
                }
            }
        }
        throw new RecognitionGatewayException("MODEL_RESPONSE_INVALID", "模型响应缺少 choices[0].message.content");
    }
}
