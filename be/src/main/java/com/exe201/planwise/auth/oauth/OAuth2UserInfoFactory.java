package com.exe201.planwise.auth.oauth;

import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;

import java.util.Map;

/**
 * Factory trả về OAuth2UserInfo phù hợp với từng provider.
 */
public class OAuth2UserInfoFactory {

    private OAuth2UserInfoFactory() {}

    public static OAuth2UserInfo getOAuth2UserInfo(String registrationId,
                                                    Map<String, Object> attributes) {
        return switch (registrationId.toLowerCase()) {
            case "google" -> new GoogleOAuth2UserInfo(attributes);
            default       -> throw new AppException(ErrorCode.OAUTH2_PROVIDER_NOT_SUPPORTED,
                    "OAuth2 provider [%s] is not supported".formatted(registrationId));
        };
    }
}
