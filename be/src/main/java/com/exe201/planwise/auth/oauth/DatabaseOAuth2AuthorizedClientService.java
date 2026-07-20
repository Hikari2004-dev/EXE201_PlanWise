package com.exe201.planwise.auth.oauth;

import com.exe201.planwise.security.UserPrincipal;
import com.exe201.planwise.user.entity.OauthProvider;
import com.exe201.planwise.user.repository.OauthProviderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2RefreshToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DatabaseOAuth2AuthorizedClientService implements OAuth2AuthorizedClientService {

    private final ClientRegistrationRepository clientRegistrationRepository;
    private final OauthProviderRepository oauthProviderRepository;

    @Override
    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public <T extends OAuth2AuthorizedClient> T loadAuthorizedClient(
            String clientRegistrationId,
            String principalName) {
        UUID userId = parseUserId(principalName);
        if (userId == null) {
            return null;
        }

        ClientRegistration registration = clientRegistrationRepository
                .findByRegistrationId(clientRegistrationId);
        if (registration == null) {
            return null;
        }

        OauthProvider provider = oauthProviderRepository
                .findByProviderAndUserId(clientRegistrationId, userId)
                .filter(value -> value.getAccessToken() != null && !value.getAccessToken().isBlank())
                .orElse(null);
        if (provider == null) {
            return null;
        }

        Instant expiresAt = provider.getExpiresAt() == null
                ? Instant.now().plus(5, ChronoUnit.MINUTES)
                : provider.getExpiresAt().toInstant();
        Instant issuedAt = provider.getUpdatedAt() == null
                ? expiresAt.minus(1, ChronoUnit.HOURS)
                : provider.getUpdatedAt().toInstant();
        if (!issuedAt.isBefore(expiresAt)) {
            issuedAt = expiresAt.minus(1, ChronoUnit.SECONDS);
        }

        OAuth2AccessToken accessToken = new OAuth2AccessToken(
                OAuth2AccessToken.TokenType.BEARER,
                provider.getAccessToken(),
                issuedAt,
                expiresAt,
                registration.getScopes()
        );
        OAuth2RefreshToken refreshToken = provider.getRefreshToken() == null
                || provider.getRefreshToken().isBlank()
                ? null
                : new OAuth2RefreshToken(
                        provider.getRefreshToken(),
                        provider.getCreatedAt() == null
                                ? issuedAt
                                : provider.getCreatedAt().toInstant()
                );

        return (T) new OAuth2AuthorizedClient(registration, principalName, accessToken, refreshToken);
    }

    @Override
    @Transactional
    public void saveAuthorizedClient(OAuth2AuthorizedClient authorizedClient, Authentication principal) {
        UUID userId = resolveUserId(principal);
        if (userId == null) {
            return;
        }

        String providerName = authorizedClient.getClientRegistration().getRegistrationId();
        oauthProviderRepository.findByProviderAndUserId(providerName, userId).ifPresent(provider -> {
            OAuth2AccessToken accessToken = authorizedClient.getAccessToken();
            provider.setAccessToken(accessToken.getTokenValue());
            provider.setExpiresAt(accessToken.getExpiresAt() == null
                    ? null
                    : accessToken.getExpiresAt().atOffset(ZoneOffset.UTC));

            OAuth2RefreshToken refreshToken = authorizedClient.getRefreshToken();
            if (refreshToken != null && !refreshToken.getTokenValue().isBlank()) {
                provider.setRefreshToken(refreshToken.getTokenValue());
            }
            oauthProviderRepository.save(provider);
        });
    }

    @Override
    @Transactional
    public void removeAuthorizedClient(String clientRegistrationId, String principalName) {
        UUID userId = parseUserId(principalName);
        if (userId == null) {
            return;
        }

        oauthProviderRepository.findByProviderAndUserId(clientRegistrationId, userId).ifPresent(provider -> {
            provider.setAccessToken(null);
            provider.setRefreshToken(null);
            provider.setExpiresAt(null);
            oauthProviderRepository.save(provider);
        });
    }

    private UUID resolveUserId(Authentication principal) {
        if (principal.getPrincipal() instanceof UserPrincipal userPrincipal) {
            return userPrincipal.getId();
        }
        return parseUserId(principal.getName());
    }

    private UUID parseUserId(String value) {
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException | NullPointerException ignored) {
            return null;
        }
    }
}
