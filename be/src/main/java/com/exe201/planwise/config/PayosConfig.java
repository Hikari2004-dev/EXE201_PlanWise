package com.exe201.planwise.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import vn.payos.PayOS;
import vn.payos.core.ClientOptions;

@Configuration
public class PayosConfig {

    @Bean
    public PayOS payOS(AppProperties appProperties) {
        AppProperties.Payos payos = appProperties.getPayos();

        ClientOptions.ClientOptionsBuilder builder = ClientOptions.builder()
                .clientId(payos.getClientId())
                .apiKey(payos.getApiKey())
                .checksumKey(payos.getChecksumKey());

        if (payos.getLogLevel() != null && !payos.getLogLevel().isBlank()) {
            builder.logLevel(resolveLogLevel(payos.getLogLevel()));
        }

        return new PayOS(builder.build());
    }

    private ClientOptions.LogLevel resolveLogLevel(String value) {
        return switch (value.trim().toUpperCase()) {
            case "DEBUG" -> ClientOptions.LogLevel.DEBUG;
            case "NONE" -> ClientOptions.LogLevel.NONE;
            default -> ClientOptions.LogLevel.INFO;
        };
    }
}
