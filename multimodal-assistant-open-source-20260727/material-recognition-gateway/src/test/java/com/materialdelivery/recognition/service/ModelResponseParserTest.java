package com.materialdelivery.recognition.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ModelResponseParserTest {

    private final ModelResponseParser parser = new ModelResponseParser(new ObjectMapper());

    @Test
    void parsesStructuredJsonWrappedInMarkdownFence() {
        ModelRecognitionPayload payload = parser.parse("""
                ```json
                {
                  "manufacturer": "某钢铁有限公司",
                  "materialName": "热轧带肋钢筋",
                  "grade": "HRB400E",
                  "specification": "Φ20",
                  "batchNo": "A20260718026",
                  "furnaceNo": "L202607081",
                  "productionDate": "2026-07-18",
                  "confidence": 0.96
                }
                ```
                """);

        assertThat(payload.recognition().batchNo()).isEqualTo("A20260718026");
        assertThat(payload.recognition().specification()).isEqualTo("Φ20");
        assertThat(payload.confidence()).isEqualTo(0.96);
    }

    @Test
    void acceptsRecognitionWrapperAndClampsConfidence() {
        ModelRecognitionPayload payload = parser.parse("""
                {
                  "recognition": {
                    "manufacturer": "某钢铁有限公司",
                    "materialName": "热轧带肋钢筋",
                    "grade": "HRB400E",
                    "specification": "Φ20",
                    "batchNo": "A20260718028",
                    "furnaceNo": "",
                    "productionDate": ""
                  },
                  "confidence": 1.4
                }
                """);

        assertThat(payload.recognition().batchNo()).isEqualTo("A20260718028");
        assertThat(payload.confidence()).isEqualTo(1);
    }
}
