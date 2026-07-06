package com.exe201.planwise.admin.controller;

import com.exe201.planwise.admin.dto.AdminStatsResponse;
import com.exe201.planwise.admin.service.AdminService;
import com.exe201.planwise.security.UserPrincipal;
import com.exe201.planwise.user.entity.User;
import com.exe201.planwise.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final UserRepository userRepository;

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/transactions/recent")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getRecentTransactions(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(adminService.getRecentTransactions(limit));
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PutMapping("/users/{userId}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> updateUserRole(
            @PathVariable UUID userId,
            @RequestBody Map<String, String> body) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String roleStr = body.get("role");
        User.UserRole newRole;
        try {
            newRole = User.UserRole.valueOf(roleStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid role. Must be USER or ADMIN"));
        }

        user.setRole(newRole);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "message", "Role updated successfully",
                "userId", user.getId(),
                "newRole", newRole.name()
        ));
    }

    @PostMapping("/users/{userId}/set-admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> setAdmin(@PathVariable UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setRole(User.UserRole.ADMIN);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "message", "User promoted to admin successfully",
                "userId", user.getId(),
                "email", user.getEmail()
        ));
    }

    /**
     * Endpoint để set admin role cho user - không cần auth admin.
     * Chỉ hoạt động khi chưa có admin nào trong hệ thống.
     */
    @PostMapping("/grant-admin")
    public ResponseEntity<Map<String, Object>> grantAdmin(@RequestBody Map<String, String> body) {
        // Check if any admin exists
        boolean hasAdmin = userRepository.findAll().stream()
                .anyMatch(u -> u.getRole() == User.UserRole.ADMIN);

        if (hasAdmin) {
            return ResponseEntity.status(403)
                    .body(Map.of("error", "Admin already exists. Please use admin panel to grant roles."));
        }

        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email is required"));
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        user.setRole(User.UserRole.ADMIN);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "message", "You are now an admin!",
                "userId", user.getId(),
                "email", user.getEmail(),
                "role", "ADMIN"
        ));
    }
}
