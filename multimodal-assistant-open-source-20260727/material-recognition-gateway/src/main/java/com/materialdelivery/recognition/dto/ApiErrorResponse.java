package com.materialdelivery.recognition.dto;

public record ApiErrorResponse(
        String code,
        String message,
        String requestId) {
}
