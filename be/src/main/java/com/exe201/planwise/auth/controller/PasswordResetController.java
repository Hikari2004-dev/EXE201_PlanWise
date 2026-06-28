package com.exe201.planwise.auth.controller;

import com.exe201.planwise.auth.dto.ForgotPasswordRequest;
import com.exe201.planwise.auth.dto.PasswordResetResponse;
import com.exe201.planwise.auth.dto.ResetPasswordRequest;
import com.exe201.planwise.auth.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth/password")
@RequiredArgsConstructor
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    @PostMapping("/forgot")
    public ResponseEntity<PasswordResetResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.forgotPassword(request);
        return ResponseEntity.ok(PasswordResetResponse.of(
                "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi liên kết đặt lại mật khẩu."
        ));
    }

    @PostMapping("/reset")
    public ResponseEntity<PasswordResetResponse> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request);
        return ResponseEntity.ok(PasswordResetResponse.of("Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay."));
    }
}
