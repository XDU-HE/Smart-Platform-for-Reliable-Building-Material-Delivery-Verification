package com.materialdelivery.recognition.service;

import com.materialdelivery.recognition.dto.MaterialRecognitionResult;

public record ModelRecognitionPayload(
        MaterialRecognitionResult recognition,
        double confidence) {
}
