package com.exe201.planwise.auth.oauth;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import java.util.LinkedHashMap;

public class GoogleOfflineAuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {

    private final DefaultOAuth2AuthorizationRequestResolver delegate;

    public GoogleOfflineAuthorizationRequestResolver(
            ClientRegistrationRepository clientRegistrationRepository,
            String authorizationRequestBaseUri) {
        this.delegate = new DefaultOAuth2AuthorizationRequestResolver(
                clientRegistrationRepository,
                authorizationRequestBaseUri
        );
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
        OAuth2AuthorizationRequest authorizationRequest = delegate.resolve(request);
        boolean googleRequest = request.getRequestURI().endsWith("/google");
        return googleRequest ? addOfflineAccess(authorizationRequest) : authorizationRequest;
    }

    @Override
    public OAuth2AuthorizationRequest resolve(
            HttpServletRequest request,
            String clientRegistrationId) {
        OAuth2AuthorizationRequest authorizationRequest =
                delegate.resolve(request, clientRegistrationId);
        return "google".equals(clientRegistrationId)
                ? addOfflineAccess(authorizationRequest)
                : authorizationRequest;
    }

    private OAuth2AuthorizationRequest addOfflineAccess(
            OAuth2AuthorizationRequest authorizationRequest) {
        if (authorizationRequest == null) {
            return null;
        }
        var parameters = new LinkedHashMap<String, Object>(
                authorizationRequest.getAdditionalParameters()
        );
        parameters.put("access_type", "offline");
        parameters.put("prompt", "consent");
        parameters.put("include_granted_scopes", "true");
        return OAuth2AuthorizationRequest.from(authorizationRequest)
                .additionalParameters(parameters)
                .build();
    }
}
