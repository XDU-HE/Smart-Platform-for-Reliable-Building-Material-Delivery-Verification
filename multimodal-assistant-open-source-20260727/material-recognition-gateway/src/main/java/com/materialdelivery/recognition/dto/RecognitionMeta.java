package com.materialdelivery.recognition.dto;

public record RecognitionMeta(
        String source,
        String model,
        long durationMs,
        double confidence,
        String requestId) {
}
