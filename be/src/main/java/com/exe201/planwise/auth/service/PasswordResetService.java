package com.exe201.planwise.auth.service;

import com.exe201.planwise.auth.dto.ForgotPasswordRequest;
import com.exe201.planwise.auth.dto.ResetPasswordRequest;
import com.exe201.planwise.auth.entity.PasswordResetToken;
import com.exe201.planwise.auth.repository.PasswordResetTokenRepository;
import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import com.exe201.planwise.user.entity.User;
import com.exe201.planwise.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;

@Service
@Slf4j
@RequiredArgsConstructor
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetMailService passwordResetMailService;

    private static final int TOKEN_BYTE_LENGTH = 32;
    private static final int RESET_TOKEN_EXPIRATION_MINUTES = 15;

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.email())
                .ifPresent(user -> {
                    createAndSendResetToken(user);
                });

        log.info("Password reset requested for email: {}", request.email());
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.token())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_VERIFICATION_TOKEN));

        if (!resetToken.isValid()) {
            if (resetToken.isExpired()) {
                throw new AppException(ErrorCode.VERIFICATION_TOKEN_EXPIRED);
            }
            throw new AppException(ErrorCode.INVALID_VERIFICATION_TOKEN, "Token đã được sử dụng");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        resetToken.setUsedAt(OffsetDateTime.now());
        passwordResetTokenRepository.save(resetToken);

        log.info("Password reset successfully for user: {}", user.getEmail());
    }

    private void createAndSendResetToken(User user) {
        String rawToken = generateSecureToken();
        OffsetDateTime expiresAt = OffsetDateTime.now().plusMinutes(RESET_TOKEN_EXPIRATION_MINUTES);

        PasswordResetToken token = passwordResetTokenRepository.findByUserId(user.getId())
                .map(existingToken -> {
                    existingToken.setToken(rawToken);
                    existingToken.setExpiresAt(expiresAt);
                    existingToken.setUsedAt(null);
                    return existingToken;
                })
                .orElseGet(() -> PasswordResetToken.builder()
                        .user(user)
                        .token(rawToken)
                        .expiresAt(expiresAt)
                        .build());

        passwordResetTokenRepository.save(token);
        passwordResetMailService.sendPasswordResetEmail(
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
}
