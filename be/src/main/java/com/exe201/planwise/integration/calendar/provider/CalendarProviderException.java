package com.exe201.planwise.integration.calendar.provider;

public class CalendarProviderException extends RuntimeException {

    public CalendarProviderException(String message) {
        super(message);
    }

    public CalendarProviderException(String message, Throwable cause) {
        super(message, cause);
    }
}
