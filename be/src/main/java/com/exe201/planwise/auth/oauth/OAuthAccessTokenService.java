package com.exe201.planwise.auth.oauth;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.oauth2.client.OAuth2AuthorizeRequest;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OAuthAccessTokenService {

    private final OAuth2AuthorizedClientManager authorizedClientManager;

    public Optional<String> getAccessToken(UUID userId, String provider) {
        var principal = UsernamePasswordAuthenticationToken.authenticated(
                userId.toString(),
                "N/A",
                AuthorityUtils.NO_AUTHORITIES
        );
        OAuth2AuthorizedClient client = authorizedClientManager.authorize(
                OAuth2AuthorizeRequest.withClientRegistrationId(provider)
                        .principal(principal)
                        .build()
        );
        return Optional.ofNullable(client)
                .map(OAuth2AuthorizedClient::getAccessToken)
                .map(token -> token.getTokenValue());
    }
}
