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
    private final Momo momo = new Momo();

    @Getter
    @Setter
    public static class Momo {
        private String partnerCode;
        private String accessKey;
        private String secretKey;
        private String apiUrl = "https://test-payment.momo.vn/v2/gateway/api/create";
        private String redirectUrl = "http://localhost:5173/payment/result";
        private String ipnUrl = "http://localhost:8080/api/v1/subscriptions/momo-ipn";
    }

    @Getter
    @Setter
    public static class Jwt {
        private String secret;
        private long accessTokenExpirationMs  = 900_000L;       // 15 phút
        private long refreshTokenExpirationMs = 604_800_000L;   // 7 ngày
    }

    @Getter
    @Setter
    public static class OAuth2 {
        private List<String> authorizedRedirectUris = List.of("http://localhost:5173/auth/callback");
    }

    @Getter
    @Setter
    public static class Cors {
        private List<String> allowedOrigins = List.of("http://localhost:5173");
    }
}
