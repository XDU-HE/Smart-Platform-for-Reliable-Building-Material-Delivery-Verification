package com.materialdelivery.recognition.dto;

public record MaterialRecognitionResult(
        String manufacturer,
        String materialName,
        String grade,
        String specification,
        String batchNo,
        String furnaceNo,
        String productionDate) {
}
