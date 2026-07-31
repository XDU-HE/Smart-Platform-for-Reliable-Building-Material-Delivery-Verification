package com.materialdelivery.recognition.exception;

import java.util.UUID;

import com.materialdelivery.recognition.dto.ApiErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger LOGGER = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(RecognitionGatewayException.class)
    public ResponseEntity<ApiErrorResponse> handleGatewayException(RecognitionGatewayException exception) {
        String requestId = UUID.randomUUID().toString();
        HttpStatus status = exception.getCode().startsWith("FILE_")
                ? HttpStatus.BAD_REQUEST
                : HttpStatus.BAD_GATEWAY;
        LOGGER.warn("Recognition request failed [{}]: {}", requestId, exception.getMessage());
        return ResponseEntity.status(status)
                .body(new ApiErrorResponse(exception.getCode(), exception.getMessage(), requestId));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleUploadLimit(MaxUploadSizeExceededException exception) {
        String requestId = UUID.randomUUID().toString();
        return ResponseEntity.badRequest()
                .body(new ApiErrorResponse("FILE_TOO_LARGE", "上传文件不能超过 10 MB", requestId));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception exception) {
        String requestId = UUID.randomUUID().toString();
        LOGGER.error("Unexpected gateway error [{}]", requestId, exception);
        return ResponseEntity.internalServerError()
                .body(new ApiErrorResponse("GATEWAY_INTERNAL_ERROR", "识别网关执行失败", requestId));
    }
}
