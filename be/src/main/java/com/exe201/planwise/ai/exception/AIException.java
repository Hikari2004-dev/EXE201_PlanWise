package com.exe201.planwise.ai.exception;

import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;

public class AIException extends AppException {

    public AIException(ErrorCode errorCode) {
        super(errorCode);
    }

    public AIException(ErrorCode errorCode, String customMessage) {
        super(errorCode, customMessage);
    }
}
