package com.materialdelivery.recognition.service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.materialdelivery.recognition.config.MultimodalProperties;
import com.materialdelivery.recognition.dto.RecognitionMeta;
import com.materialdelivery.recognition.dto.RecognitionResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class RecognitionService {

    private static final String OUTPUT_SCHEMA = """
            只输出一个 JSON 对象，不要输出 Markdown、解释或额外字段。字段结构：
            {
              "manufacturer": "生产厂家",
              "materialName": "材料名称",
              "grade": "牌号",
              "specification": "规格",
              "batchNo": "批次号",
              "furnaceNo": "炉号，未识别时为空字符串",
              "productionDate": "生产日期，统一为 YYYY-MM-DD，未识别时为空字符串",
              "confidence": 0 到 1 之间的整体识别置信度
            }
            不要推测图像中不存在的编号；中文、字母、数字和直径符号应按原始凭证保留。
            """;

    private static final String FACTORY_PROMPT = """
            你是建筑材料质量凭证结构化识别助手。以下图片依次包含质量证明书页面和出厂铭牌。
            请交叉核对两类凭证，提取同一批材料的身份字段；若局部模糊，以两份凭证中更清晰且相互支持的内容为准。
            """ + OUTPUT_SCHEMA;

    private static final String ARRIVAL_PROMPT = """
            你是建筑材料到场铭牌结构化识别助手。请仅根据现场铭牌图片提取材料身份字段。
            """ + OUTPUT_SCHEMA;

    private final EvidenceMediaService mediaService;
    private final OpenAiCompatibleClient modelClient;
    private final MultimodalProperties properties;

    public RecognitionService(
            EvidenceMediaService mediaService,
            OpenAiCompatibleClient modelClient,
            MultimodalProperties properties) {
        this.mediaService = mediaService;
        this.modelClient = modelClient;
        this.properties = properties;
    }

    public RecognitionResponse recognizeFactory(MultipartFile certificate, MultipartFile nameplate) {
        long startedAt = System.nanoTime();
        List<EvidenceImage> images = new ArrayList<>(mediaService.prepareCertificate(certificate));
        images.add(mediaService.prepareNameplate(nameplate, "出厂铭牌"));
        ModelRecognitionPayload payload = modelClient.recognize(FACTORY_PROMPT, List.copyOf(images));
        return response(payload, startedAt);
    }

    public RecognitionResponse recognizeArrival(MultipartFile nameplate) {
        long startedAt = System.nanoTime();
        ModelRecognitionPayload payload = modelClient.recognize(
                ARRIVAL_PROMPT,
                List.of(mediaService.prepareNameplate(nameplate, "到场铭牌")));
        return response(payload, startedAt);
    }

    private RecognitionResponse response(ModelRecognitionPayload payload, long startedAt) {
        long durationMs = (System.nanoTime() - startedAt) / 1_000_000;
        RecognitionMeta meta = new RecognitionMeta(
                "REAL",
                properties.model(),
                durationMs,
                payload.confidence(),
                UUID.randomUUID().toString());
        return new RecognitionResponse(payload.recognition(), meta);
    }
}
