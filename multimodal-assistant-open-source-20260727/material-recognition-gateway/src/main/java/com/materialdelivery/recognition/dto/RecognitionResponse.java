package com.materialdelivery.recognition.dto;

public record RecognitionResponse(
        MaterialRecognitionResult recognition,
        RecognitionMeta meta) {
}
