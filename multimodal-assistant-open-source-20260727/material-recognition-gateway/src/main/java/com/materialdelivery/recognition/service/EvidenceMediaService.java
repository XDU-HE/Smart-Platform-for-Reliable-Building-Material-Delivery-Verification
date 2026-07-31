package com.materialdelivery.recognition.service;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Set;

import javax.imageio.ImageIO;

import com.materialdelivery.recognition.config.MultimodalProperties;
import com.materialdelivery.recognition.exception.RecognitionGatewayException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class EvidenceMediaService {

    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;
    private static final Set<String> IMAGE_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp");
    private static final String PDF_TYPE = "application/pdf";

    private final MultimodalProperties properties;

    public EvidenceMediaService(MultimodalProperties properties) {
        this.properties = properties;
    }

    public List<EvidenceImage> prepareCertificate(MultipartFile file) {
        validate(file, true, "质量证明书");
        if (PDF_TYPE.equals(normalizeContentType(file))) {
            return renderPdf(file);
        }
        return List.of(toEvidenceImage(file));
    }

    public EvidenceImage prepareNameplate(MultipartFile file, String label) {
        validate(file, false, label);
        return toEvidenceImage(file);
    }

    private void validate(MultipartFile file, boolean allowPdf, String label) {
        if (file == null || file.isEmpty()) {
            throw new RecognitionGatewayException("FILE_REQUIRED", label + "不能为空");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new RecognitionGatewayException("FILE_TOO_LARGE", label + "不能超过 10 MB");
        }
        String contentType = normalizeContentType(file);
        if (!IMAGE_TYPES.contains(contentType) && !(allowPdf && PDF_TYPE.equals(contentType))) {
            throw new RecognitionGatewayException("FILE_TYPE_UNSUPPORTED", label + "文件格式不支持");
        }
    }

    private List<EvidenceImage> renderPdf(MultipartFile file) {
        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            if (document.getNumberOfPages() == 0) {
                throw new RecognitionGatewayException("FILE_INVALID", "质量证明书 PDF 不包含有效页面");
            }

            PDFRenderer renderer = new PDFRenderer(document);
            int pageCount = Math.min(document.getNumberOfPages(), properties.maxPdfPages());
            List<EvidenceImage> images = new ArrayList<>(pageCount);

            for (int pageIndex = 0; pageIndex < pageCount; pageIndex++) {
                BufferedImage image = renderer.renderImageWithDPI(pageIndex, 130, ImageType.RGB);
                try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                    ImageIO.write(image, "jpg", output);
                    images.add(new EvidenceImage(
                            safeFileName(file) + "#page-" + (pageIndex + 1),
                            "image/jpeg",
                            Base64.getEncoder().encodeToString(output.toByteArray())));
                }
            }
            return List.copyOf(images);
        } catch (RecognitionGatewayException exception) {
            throw exception;
        } catch (IOException exception) {
            throw new RecognitionGatewayException("FILE_INVALID", "质量证明书 PDF 解析失败", exception);
        }
    }

    private EvidenceImage toEvidenceImage(MultipartFile file) {
        try {
            return new EvidenceImage(
                    safeFileName(file),
                    normalizeContentType(file),
                    Base64.getEncoder().encodeToString(file.getBytes()));
        } catch (IOException exception) {
            throw new RecognitionGatewayException("FILE_READ_FAILED", "上传文件读取失败", exception);
        }
    }

    private String normalizeContentType(MultipartFile file) {
        String contentType = file.getContentType();
        return contentType == null ? "" : contentType.toLowerCase();
    }

    private String safeFileName(MultipartFile file) {
        String fileName = file.getOriginalFilename();
        return fileName == null || fileName.isBlank() ? "uploaded-evidence" : fileName;
    }
}
