package com.exe201.planwise.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@ConfigurationProperties(prefix = "app")
@Getter
@Setter
public class AppProperties {

    private final Jwt jwt = new Jwt();
    private final OAuth2 oauth2 = new OAuth2();
    private final Cors cors = new Cors();
    private final Mail mail = new Mail();
    private final Momo momo = new Momo();
    private final Payos payos = new Payos();
    private final R2 r2 = new R2();

    @Getter
    @Setter
    public static class Mail {
        private String from;
        private String verificationBaseUrl;
        private long verificationTokenExpirationMinutes = 60;

        public String buildVerificationUrl(String token) {
            String separator = verificationBaseUrl.contains("?") ? "&" : "?";
            return verificationBaseUrl + separator + "token=" + token;
        }
    }

    @Getter
    @Setter
    public static class Momo {
        private String partnerCode;
        private String accessKey;
        private String secretKey;
        private String apiUrl = "https://test-payment.momo.vn/v2/gateway/api/create";
        private String redirectUrl;
        private String ipnUrl;
    }

    @Getter
    @Setter
    public static class Payos {
        private String clientId;
        private String apiKey;
        private String checksumKey;
        private String returnUrl;
        private String cancelUrl;
        private String webhookUrl;
        private String logLevel;
    }

    @Getter
    @Setter
    public static class R2 {
        private boolean enabled = false;
        private String endpoint;
        private String region = "auto";
        private String bucket;
        private String accessKeyId;
        private String secretAccessKey;
        private String publicBaseUrl;
        private long presignTtlSeconds = 300;
        private long maxUploadSizeBytes = 5_242_880L;
    }

    @Getter
    @Setter
    public static class Jwt {
        private String secret;
        private long accessTokenExpirationMs = 900_000L;
        private long refreshTokenExpirationMs = 604_800_000L;
    }

    @Getter
    @Setter
    public static class OAuth2 {
        private List<String> authorizedRedirectUris;
    }

    @Getter
    @Setter
    public static class Cors {
        private List<String> allowedOrigins;
    }
}