package com.materialdelivery.recognition.exception;

public class RecognitionGatewayException extends RuntimeException {

    private final String code;

    public RecognitionGatewayException(String code, String message) {
        super(message);
        this.code = code;
    }

    public RecognitionGatewayException(String code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
