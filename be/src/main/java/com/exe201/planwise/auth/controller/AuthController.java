package com.exe201.planwise.auth.controller;

import com.exe201.planwise.auth.dto.AuthResponse;
import com.exe201.planwise.auth.dto.LoginRequest;
import com.exe201.planwise.auth.dto.RegisterRequest;
import com.exe201.planwise.auth.dto.TokenRefreshRequest;
import com.exe201.planwise.auth.service.AuthService;
import com.exe201.planwise.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/v1/auth/register
     * Đăng ký tài khoản mới bằng email + password.
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    /**
     * POST /api/v1/auth/login
     * Đăng nhập bằng email + password.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /**
     * POST /api/v1/auth/refresh
     * Lấy Access Token mới từ Refresh Token.
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody TokenRefreshRequest request) {
        return ResponseEntity.ok(authService.refresh(request));
    }

    /**
     * POST /api/v1/auth/logout
     * Logout (client-side: xoá token; server có thể blacklist refresh token nếu cần).
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // Stateless: client tự xoá token
        // TODO: Implement refresh token blacklist nếu cần revoke server-side
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/v1/auth/me
     * Lấy thông tin user đang đăng nhập.
     */
    @GetMapping("/me")
    public ResponseEntity<AuthResponse.UserInfo> getMe(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(authService.getMe(principal.getId()));
    }
}
