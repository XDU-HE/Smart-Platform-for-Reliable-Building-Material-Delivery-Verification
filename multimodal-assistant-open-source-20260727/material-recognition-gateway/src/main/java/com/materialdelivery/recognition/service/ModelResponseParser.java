package com.materialdelivery.recognition.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.materialdelivery.recognition.dto.MaterialRecognitionResult;
import com.materialdelivery.recognition.exception.RecognitionGatewayException;
import org.springframework.stereotype.Component;

@Component
public class ModelResponseParser {

    private final ObjectMapper objectMapper;

    public ModelResponseParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public ModelRecognitionPayload parse(String content) {
        if (content == null || content.isBlank()) {
            throw new RecognitionGatewayException("MODEL_RESPONSE_INVALID", "模型未返回识别内容");
        }

        String normalized = stripMarkdownFence(content.trim());

        try {
            JsonNode root = objectMapper.readTree(normalized);
            JsonNode recognitionNode = root.has("recognition") ? root.get("recognition") : root;
            MaterialRecognitionResult recognition = new MaterialRecognitionResult(
                    requiredText(recognitionNode, "manufacturer"),
                    requiredText(recognitionNode, "materialName"),
                    requiredText(recognitionNode, "grade"),
                    requiredText(recognitionNode, "specification"),
                    requiredText(recognitionNode, "batchNo"),
                    optionalText(recognitionNode, "furnaceNo"),
                    optionalText(recognitionNode, "productionDate"));
            double confidence = root.path("confidence").asDouble(
                    recognitionNode.path("confidence").asDouble(0));
            return new ModelRecognitionPayload(recognition, clampConfidence(confidence));
        } catch (JsonProcessingException exception) {
            throw new RecognitionGatewayException(
                    "MODEL_RESPONSE_INVALID",
                    "模型返回内容不是有效的结构化 JSON",
                    exception);
        }
    }

    private String requiredText(JsonNode node, String fieldName) {
        String value = optionalText(node, fieldName);
        if (value.isBlank()) {
            throw new RecognitionGatewayException(
                    "MODEL_RESPONSE_INVALID",
                    "模型结果缺少字段：" + fieldName);
        }
        return value;
    }

    private String optionalText(JsonNode node, String fieldName) {
        JsonNode value = node.path(fieldName);
        return value.isMissingNode() || value.isNull() ? "" : value.asText("").trim();
    }

    private String stripMarkdownFence(String content) {
        if (!content.startsWith("```")) {
            return content;
        }
        int firstLineBreak = content.indexOf('\n');
        int closingFence = content.lastIndexOf("```");
        if (firstLineBreak < 0 || closingFence <= firstLineBreak) {
            return content;
        }
        return content.substring(firstLineBreak + 1, closingFence).trim();
    }

    private double clampConfidence(double confidence) {
        return Math.max(0, Math.min(1, confidence));
    }
}
