package com.exe201.planwise.subscription.controller;

import com.exe201.planwise.security.UserPrincipal;
import com.exe201.planwise.subscription.dto.MomoIPNRequest;
import com.exe201.planwise.subscription.dto.MomoPaymentResponse;
import com.exe201.planwise.subscription.service.MomoPaymentService;
import com.exe201.planwise.user.entity.PaymentTransaction;
import com.exe201.planwise.user.entity.SubscriptionPlan;
import com.exe201.planwise.user.repository.PaymentTransactionRepository;
import com.exe201.planwise.user.repository.SubscriptionPlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
@Slf4j
public class SubscriptionController {

    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final MomoPaymentService momoPaymentService;
    private final PaymentTransactionRepository paymentTransactionRepository;

    /**
     * GET /api/v1/subscriptions/plans
     * Lấy danh sách các gói hội viên hiện có.
     */
    @GetMapping("/plans")
    public ResponseEntity<List<SubscriptionPlan>> getPlans() {
        return ResponseEntity.ok(subscriptionPlanRepository.findAll());
    }

    /**
     * POST /api/v1/subscriptions/purchase
     * Tạo đường dẫn thanh toán qua Momo cho một gói hội viên.
     */
    @PostMapping("/purchase")
    public ResponseEntity<MomoPaymentResponse> purchasePlan(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, String> body) {
        
        String planIdStr = body.get("planId");
        if (planIdStr == null) {
            return ResponseEntity.badRequest().build();
        }
        
        UUID planId = UUID.fromString(planIdStr);
        MomoPaymentResponse response = momoPaymentService.createPayment(principal.getId(), planId);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/subscriptions/momo-ipn
     * Nhận thông báo thanh toán (Webhook IPN) từ Momo Server.
     */
    @PostMapping("/momo-ipn")
    public ResponseEntity<Void> receiveMomoIPN(@RequestBody MomoIPNRequest ipnRequest) {
        log.info("Received IPN webhook from Momo for order: {}", ipnRequest.getOrderId());
        try {
            momoPaymentService.processPaymentCallback(ipnRequest);
        } catch (Exception e) {
            log.error("Error processing Momo IPN webhook", e);
            // Vẫn trả về 200/204 để Momo không gửi lại liên tục nếu không cần thiết,
            // hoặc trả về lỗi tùy chính sách. Theo tài liệu Momo nên trả về 204.
        }
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/v1/subscriptions/verify
     * Frontend gọi lên để tự chủ động xác thực giao dịch sau khi nhận redirect từ Momo.
     */
    @PostMapping("/verify")
    public ResponseEntity<Map<String, String>> verifyPayment(@RequestBody MomoIPNRequest callbackParams) {
        log.info("Verifying callback params from client redirect for order: {}", callbackParams.getOrderId());
        momoPaymentService.processPaymentCallback(callbackParams);
        return ResponseEntity.ok(Map.of("status", "SUCCESS"));
    }

    /**
     * GET /api/v1/subscriptions/transactions/{orderId}/status
     * Kiểm tra trạng thái giao dịch hiện tại trong DB.
     */
    @GetMapping("/transactions/{orderId}/status")
    public ResponseEntity<Map<String, String>> getTransactionStatus(@PathVariable String orderId) {
        PaymentTransaction transaction = paymentTransactionRepository.findByOrderId(orderId)
                .orElse(null);
        if (transaction == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Map.of("status", transaction.getStatus()));
    }

    /**
     * POST /api/v1/subscriptions/mock-ipn
     * Giả lập thanh toán thành công (Môi trường phát triển cục bộ DEV).
     */
    @PostMapping("/mock-ipn")
    public ResponseEntity<Map<String, String>> mockIpn(@RequestParam String orderId) {
        log.info("Triggering mock IPN payment verification for order: {}", orderId);
        momoPaymentService.mockIpnCallback(orderId);
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Đã kích hoạt giả lập gói hội viên thành công!"
        ));
    }
}
