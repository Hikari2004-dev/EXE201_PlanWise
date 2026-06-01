package com.exe201.planwise.auth.oauth;

import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import com.exe201.planwise.security.UserPrincipal;
import com.exe201.planwise.user.entity.OauthProvider;
import com.exe201.planwise.user.entity.User;
import com.exe201.planwise.user.entity.UserSettings;
import com.exe201.planwise.user.repository.OauthProviderRepository;
import com.exe201.planwise.user.repository.UserRepository;
import com.exe201.planwise.user.repository.UserSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final OauthProviderRepository oauthProviderRepository;
    private final UserSettingsRepository userSettingsRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        OAuth2UserInfo userInfo = OAuth2UserInfoFactory
                .getOAuth2UserInfo(registrationId, oAuth2User.getAttributes());

        if (!StringUtils.hasText(userInfo.getEmail())) {
            throw new AppException(ErrorCode.OAUTH2_EMAIL_NOT_FOUND);
        }

        User user = processOAuth2User(registrationId, userInfo);
        return UserPrincipal.create(user, oAuth2User.getAttributes());
    }

    private User processOAuth2User(String provider, OAuth2UserInfo userInfo) {
        // Kiểm tra OauthProvider đã tồn tại chưa
        Optional<OauthProvider> existingProvider =
                oauthProviderRepository.findByProviderAndProviderUid(provider, userInfo.getId());

        if (existingProvider.isPresent()) {
            // Đã có → update thông tin user nếu cần
            User user = existingProvider.get().getUser();
            updateExistingUser(user, userInfo);
            return user;
        }

        // Chưa có OauthProvider → kiểm tra xem email đã đăng ký chưa
        Optional<User> existingUser = userRepository.findByEmail(userInfo.getEmail());

        User user = existingUser.orElseGet(() -> createNewUser(userInfo));

        // Liên kết OauthProvider
        OauthProvider oauthProvider = OauthProvider.builder()
                .user(user)
                .provider(provider)
                .providerUid(userInfo.getId())
                .build();
        oauthProviderRepository.save(oauthProvider);

        return user;
    }

    private User createNewUser(OAuth2UserInfo userInfo) {
        log.info("Creating new user from OAuth2: {}", userInfo.getEmail());

        User user = User.builder()
                .email(userInfo.getEmail())
                .fullName(userInfo.getName())
                .avatarUrl(userInfo.getImageUrl())
                .emailVerified(true)   // Email từ Google đã được verify
                .build();

        user = userRepository.save(user);

        // Kiểm tra settings đã tồn tại chưa (do trigger database tạo tự động)
        // Dùng native query để bypass Hibernate cache và kiểm tra trực tiếp từ DB
        if (!userSettingsRepository.existsByUserIdDirect(user.getId())) {
            UserSettings settings = UserSettings.builder()
                    .user(user)
                    .build();
            user.setSettings(settings);
            user = userRepository.save(user);
        }

        return user;
    }

    private void updateExistingUser(User user, OAuth2UserInfo userInfo) {
        if (userInfo.getName() != null) {
            user.setFullName(userInfo.getName());
        }
        if (userInfo.getImageUrl() != null && user.getAvatarUrl() == null) {
            user.setAvatarUrl(userInfo.getImageUrl());
        }
        userRepository.save(user);
    }
}
