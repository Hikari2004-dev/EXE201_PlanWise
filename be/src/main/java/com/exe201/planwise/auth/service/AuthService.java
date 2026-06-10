package com.exe201.planwise.auth.service;

import com.exe201.planwise.auth.dto.AuthResponse;
import com.exe201.planwise.auth.dto.LoginRequest;
import com.exe201.planwise.auth.dto.RegisterRequest;
import com.exe201.planwise.auth.dto.TokenRefreshRequest;
import com.exe201.planwise.auth.entity.EmailVerificationToken;
import com.exe201.planwise.auth.repository.EmailVerificationTokenRepository;
import com.exe201.planwise.config.AppProperties;
import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import com.exe201.planwise.security.JwtTokenProvider;
import com.exe201.planwise.security.UserPrincipal;
import com.exe201.planwise.user.entity.User;
import com.exe201.planwise.user.entity.UserSettings;
import com.exe201.planwise.user.repository.UserRepository;
import com.exe201.planwise.user.repository.UserSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserSettingsRepository userSettingsRepository;
    private final EmailVerificationTokenRepository verificationTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final EmailVerificationMailService emailVerificationMailService;
    private final AppProperties appProperties;

    private static final int TOKEN_BYTE_LENGTH = 32;

    // ── Register ──────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        User user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .emailVerified(false)
                .build();

        user = userRepository.save(user);

        if (!userSettingsRepository.existsByUserIdDirect(user.getId())) {
            UserSettings settings = UserSettings.builder()
                    .user(user)
                    .build();
            user.setSettings(settings);
            user = userRepository.save(user);
        }

        log.info("New user registered: {}", user.getEmail());

        createAndSendVerificationToken(user);
        seedDefaultCategories(user.getId());

        UserPrincipal principal = UserPrincipal.create(user);
        String accessToken = jwtTokenProvider.generateAccessToken(principal);
        String refreshToken = jwtTokenProvider.generateRefreshToken(principal);

        return AuthResponse.of(accessToken, refreshToken, user);
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );

            UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
            User user = userRepository.findById(principal.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            if (!user.isActive()) {
                throw new AppException(ErrorCode.USER_DISABLED);
            }

            if (!user.isEmailVerified()) {
                throw new AppException(ErrorCode.EMAIL_NOT_VERIFIED);
            }

            user.setLastLoginAt(OffsetDateTime.now());
            userRepository.save(user);

            String accessToken = jwtTokenProvider.generateAccessToken(principal);
            String refreshToken = jwtTokenProvider.generateRefreshToken(principal);

            log.info("User logged in: {}", user.getEmail());
            return AuthResponse.of(accessToken, refreshToken, user);

        } catch (BadCredentialsException ex) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }
    }

    // ── Email Verification ────────────────────────────────────────────────────

    @Transactional
    public void verifyEmail(String token) {
        EmailVerificationToken verificationToken = verificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_VERIFICATION_TOKEN));

        if (verificationToken.isExpired()) {
            throw new AppException(ErrorCode.VERIFICATION_TOKEN_EXPIRED);
        }

        if (verificationToken.isVerified()) {
            return;
        }

        User user = verificationToken.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);

        verificationToken.setVerifiedAt(OffsetDateTime.now());
        verificationTokenRepository.save(verificationToken);

        log.info("Email verified for user: {}", user.getEmail());
    }

    @Transactional
    public void resendVerification(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (user.isEmailVerified()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Email đã được xác thực trước đó");
        }

        createAndSendVerificationToken(user);
    }

    // ── Refresh Token ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AuthResponse refresh(TokenRefreshRequest request) {
        String refreshToken = request.refreshToken();

        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new AppException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        UUID userId = jwtTokenProvider.getUserIdFromToken(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (!user.isActive()) {
            throw new AppException(ErrorCode.USER_DISABLED);
        }

        UserPrincipal principal = UserPrincipal.create(user);
        String newAccessToken = jwtTokenProvider.generateAccessToken(principal);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(principal);

        return AuthResponse.of(newAccessToken, newRefreshToken, user);
    }

    // ── Me ────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AuthResponse.UserInfo getMe(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return AuthResponse.UserInfo.from(user);
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    private void createAndSendVerificationToken(User user) {
        String rawToken = generateSecureToken();
        OffsetDateTime expiresAt = OffsetDateTime.now()
                .plusMinutes(appProperties.getMail().getVerificationTokenExpirationMinutes());

        EmailVerificationToken token = verificationTokenRepository.findByUserId(user.getId())
                .map(existingToken -> {
                    existingToken.setToken(rawToken);
                    existingToken.setExpiresAt(expiresAt);
                    existingToken.setVerifiedAt(null);
                    return existingToken;
                })
                .orElseGet(() -> EmailVerificationToken.builder()
                        .user(user)
                        .token(rawToken)
                        .expiresAt(expiresAt)
                        .build());

        verificationTokenRepository.save(token);

        emailVerificationMailService.sendVerificationEmail(
                user.getEmail(),
                user.getFullName(),
                rawToken
        );
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[TOKEN_BYTE_LENGTH];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private void seedDefaultCategories(UUID userId) {
        try {
            userRepository.seedDefaultCategories(userId);
        } catch (Exception e) {
            log.warn("Could not seed default categories for user {}: {}", userId, e.getMessage());
        }
    }
}
