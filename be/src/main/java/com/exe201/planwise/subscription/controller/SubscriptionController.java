package com.exe201.planwise.subscription.controller;

import com.exe201.planwise.security.UserPrincipal;
import com.exe201.planwise.subscription.dto.MomoIPNRequest;
import com.exe201.planwise.subscription.service.MomoPaymentService;
import com.exe201.planwise.subscription.service.VnpayPaymentService;
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
    private final VnpayPaymentService vnpayPaymentService;
    private final PaymentTransactionRepository paymentTransactionRepository;

    @GetMapping("/plans")
    public ResponseEntity<List<SubscriptionPlan>> getPlans() {
        return ResponseEntity.ok(subscriptionPlanRepository.findAll());
    }

    @PostMapping("/purchase")
    public ResponseEntity<Map<String, String>> purchasePlan(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, String> body) {

        String planIdStr = body.get("planId");

        if (planIdStr == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Thiếu planId"));
        }

        UUID planId = UUID.fromString(planIdStr);

        Map<String, String> payment = vnpayPaymentService.createPayment(principal.getId(), planId);

        return ResponseEntity.ok(payment);
    }

    /**
     * VNPay return URL endpoint - xác thực callback từ VNPay khi user được redirect về.
     * Frontend gọi endpoint này với tất cả query params từ VNPay.
     */
    @GetMapping("/vnpay-return")
    public ResponseEntity<Map<String, String>> vnpayReturn(@RequestParam Map<String, String> vnpParams) {
        log.info("Received VNPay return callback with params: {}", vnpParams.keySet());
        Map<String, String> result = vnpayPaymentService.verifyVnpayReturn(vnpParams);
        return ResponseEntity.ok(result);
    }

    /**
     * VNPay IPN (server-to-server) endpoint - VNPay gọi trực tiếp.
     */
    @GetMapping("/vnpay-ipn")
    public ResponseEntity<Map<String, String>> vnpayIpn(@RequestParam Map<String, String> vnpParams) {
        log.info("Received VNPay IPN webhook with params: {}", vnpParams.keySet());
        try {
            vnpayPaymentService.verifyVnpayReturn(vnpParams);
            return ResponseEntity.ok(Map.of("RspCode", "00", "Message", "Confirm Success"));
        } catch (Exception e) {
            log.error("Error processing VNPay IPN", e);
            return ResponseEntity.ok(Map.of("RspCode", "99", "Message", e.getMessage()));
        }
    }

    @PostMapping("/momo-ipn")
    public ResponseEntity<Void> receiveMomoIPN(@RequestBody MomoIPNRequest ipnRequest) {
        log.info("Received IPN webhook from Momo for order: {}", ipnRequest.getOrderId());
        try {
            momoPaymentService.processPaymentCallback(ipnRequest);
        } catch (Exception e) {
            log.error("Error processing Momo IPN webhook", e);
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/verify")
    public ResponseEntity<Map<String, String>> verifyPayment(@RequestBody MomoIPNRequest callbackParams) {
        log.info("Verifying callback params from client redirect for order: {}", callbackParams.getOrderId());
        momoPaymentService.processPaymentCallback(callbackParams);
        return ResponseEntity.ok(Map.of("status", "SUCCESS"));
    }

    @GetMapping("/transactions/{orderId}/status")
    public ResponseEntity<Map<String, String>> getTransactionStatus(@PathVariable String orderId) {
        PaymentTransaction transaction = paymentTransactionRepository.findByOrderId(orderId)
                .orElse(null);
        if (transaction == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Map.of("status", transaction.getStatus()));
    }

    @PostMapping("/mock-ipn")
    public ResponseEntity<Map<String, String>> mockIpn(@RequestParam String orderId) {
        log.info("Triggering mock IPN payment verification for order: {}", orderId);
        vnpayPaymentService.mockVnpayIpn(orderId);
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Đã kích hoạt giả lập gói hội viên thành công!"));
    }
}