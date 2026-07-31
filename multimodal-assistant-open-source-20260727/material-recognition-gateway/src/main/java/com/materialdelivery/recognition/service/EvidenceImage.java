package com.materialdelivery.recognition.service;

public record EvidenceImage(
        String fileName,
        String mediaType,
        String base64Data) {

    public String dataUrl() {
        return "data:" + mediaType + ";base64," + base64Data;
    }
}
