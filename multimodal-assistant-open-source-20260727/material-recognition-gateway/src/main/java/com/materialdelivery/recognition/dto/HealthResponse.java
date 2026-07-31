package com.materialdelivery.recognition.dto;

public record HealthResponse(
        String status,
        boolean configured,
        String provider,
        String model) {
}
