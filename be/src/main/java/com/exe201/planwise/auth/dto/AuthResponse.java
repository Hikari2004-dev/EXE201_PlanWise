package com.exe201.planwise.auth.dto;

import com.exe201.planwise.user.entity.User;

import java.util.UUID;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        UserInfo user
) {
    public static AuthResponse of(String accessToken, String refreshToken, User user) {
        return new AuthResponse(
                accessToken,
                refreshToken,
                "Bearer",
                UserInfo.from(user)
        );
    }

    public record UserInfo(
            UUID id,
            String email,
            String fullName,
            String avatarUrl,
            String language,
            String role,
            boolean isPremium,
            java.time.OffsetDateTime premiumExpiresAt
    ) {
        public static UserInfo from(User user) {
            return new UserInfo(
                    user.getId(),
                    user.getEmail(),
                    user.getFullName(),
                    user.getAvatarUrl(),
                    user.getLanguage(),
                    user.getRole().name(),
                    user.isPremium(),
                    user.getPremiumExpiresAt()
            );
        }
    }
}
