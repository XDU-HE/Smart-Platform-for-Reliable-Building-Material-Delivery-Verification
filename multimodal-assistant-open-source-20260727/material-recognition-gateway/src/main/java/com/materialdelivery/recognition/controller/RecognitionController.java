package com.materialdelivery.recognition.controller;

import com.materialdelivery.recognition.config.MultimodalProperties;
import com.materialdelivery.recognition.dto.HealthResponse;
import com.materialdelivery.recognition.dto.RecognitionResponse;
import com.materialdelivery.recognition.service.RecognitionService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/recognition")
public class RecognitionController {

    private final RecognitionService recognitionService;
    private final MultimodalProperties properties;

    public RecognitionController(
            RecognitionService recognitionService,
            MultimodalProperties properties) {
        this.recognitionService = recognitionService;
        this.properties = properties;
    }

    @GetMapping("/health")
    public HealthResponse health() {
        return new HealthResponse(
                "UP",
                properties.configured(),
                properties.provider(),
                properties.model());
    }

    @PostMapping(value = "/factory", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public RecognitionResponse recognizeFactory(
            @RequestPart("certificate") MultipartFile certificate,
            @RequestPart("nameplate") MultipartFile nameplate) {
        return recognitionService.recognizeFactory(certificate, nameplate);
    }

    @PostMapping(value = "/arrival", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public RecognitionResponse recognizeArrival(
            @RequestPart("nameplate") MultipartFile nameplate) {
        return recognitionService.recognizeArrival(nameplate);
    }
}
