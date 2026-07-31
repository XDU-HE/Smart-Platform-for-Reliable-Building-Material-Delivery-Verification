package com.materialdelivery.recognition.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

import com.materialdelivery.recognition.config.MultimodalProperties;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThat;

class EvidenceMediaServiceTest {

    private final EvidenceMediaService service = new EvidenceMediaService(
            new MultimodalProperties(
                    "openai-compatible",
                    "https://example.invalid/v1",
                    "test-key",
                    "test-model",
                    2,
                    3,
                    List.of("http://localhost:5173")));

    @Test
    void convertsPdfPagesToJpegEvidence() throws IOException {
        byte[] pdfBytes;
        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            document.addPage(new PDPage());
            document.addPage(new PDPage());
            document.save(output);
            pdfBytes = output.toByteArray();
        }

        MockMultipartFile file = new MockMultipartFile(
                "certificate",
                "certificate.pdf",
                "application/pdf",
                pdfBytes);

        List<EvidenceImage> images = service.prepareCertificate(file);

        assertThat(images).hasSize(2);
        assertThat(images).allMatch(image -> image.mediaType().equals("image/jpeg"));
        assertThat(images).allMatch(image -> !image.base64Data().isBlank());
    }
}
