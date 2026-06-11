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
    private final Vnpay vnpay = new Vnpay();

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
    public static class Vnpay {
        private String tmnCode;
        private String hashSecret;
        private String payUrl;
        private String returnUrl;
        private String ipnUrl;
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